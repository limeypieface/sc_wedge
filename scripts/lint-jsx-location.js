#!/usr/bin/env node

/*
 * JSX Location Linter
 *
 * Identifies JSX/TSX files outside of approved component locations.
 *
 * Approved locations for JSX:
 *   /src/shared/ui            - Shared UI component library
 *   /src/app/[route]/page.tsx - Page files (should be thin)
 *   /src/app/[route]/layout   - Layout files
 *   /src/app/_components      - Feature-specific components
 *   /src/components           - Legacy (flagged for migration)
 *
 * Violations:
 *   /src/lib                  - Should be pure utilities
 *   /src/features             - Should use shared/ui components
 *   /src/engines              - Must be pure domain logic
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Patterns for approved JSX locations
const APPROVED_PATTERNS = [
  'src/shared/ui/**/*.tsx',
  'src/app/**/page.tsx',
  'src/app/**/layout.tsx',
  'src/app/**/loading.tsx',
  'src/app/**/error.tsx',
  'src/app/**/not-found.tsx',
  'src/app/**/_components/**/*.tsx',
  'src/components/**/*.tsx',  // Legacy - will be flagged separately
];

// Patterns for forbidden JSX locations
const FORBIDDEN_PATTERNS = [
  'src/lib/**/*.tsx',
  'src/engines/**/*.tsx',
  'src/features/**/*.tsx',
  'src/types/**/*.tsx',
  'src/hooks/**/*.tsx',
  'src/context/**/*.tsx',
];

// Check if file contains JSX
function containsJSX(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Look for JSX patterns: <Component, <div, etc.
    // Exclude type annotations like Array<string>
    const jsxPattern = /<[A-Z][a-zA-Z]*[\s/>]|<[a-z]+[\s/>]/;
    return jsxPattern.test(content);
  } catch (e) {
    return false;
  }
}

// Check if file is a thin page (minimal JSX, just composition)
function isThinPage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    // A thin page should have fewer than 15 meaningful lines
    return lines.length < 15;
  } catch (e) {
    return false;
  }
}

// Categorize a file
function categorizeFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);

  // Check approved patterns
  if (relativePath.startsWith('src/shared/ui/')) {
    return { category: 'approved', location: 'shared/ui' };
  }

  if (relativePath.startsWith('src/components/')) {
    return { category: 'legacy', location: 'components (migrate to shared/ui)' };
  }

  if (relativePath.match(/src\/app\/.*\/page\.tsx$/)) {
    const thin = isThinPage(filePath);
    return {
      category: thin ? 'approved' : 'warning',
      location: thin ? 'thin page' : 'FAT PAGE - needs refactoring'
    };
  }

  if (relativePath.match(/src\/app\/.*\/(layout|loading|error|not-found)\.tsx$/)) {
    return { category: 'approved', location: 'app router file' };
  }

  if (relativePath.match(/src\/app\/.*\/_components\//)) {
    return { category: 'approved', location: 'feature components' };
  }

  // Check forbidden patterns
  if (relativePath.startsWith('src/lib/')) {
    return { category: 'violation', location: 'lib (should be pure utilities)' };
  }

  if (relativePath.startsWith('src/engines/')) {
    return { category: 'violation', location: 'engines (must be pure domain logic)' };
  }

  if (relativePath.startsWith('src/features/')) {
    return { category: 'violation', location: 'features (use shared/ui)' };
  }

  if (relativePath.startsWith('src/types/')) {
    return { category: 'violation', location: 'types (no JSX in type files)' };
  }

  if (relativePath.startsWith('src/hooks/')) {
    return { category: 'warning', location: 'hooks (prefer shared/hooks)' };
  }

  if (relativePath.startsWith('src/context/')) {
    return { category: 'warning', location: 'context (review needed)' };
  }

  return { category: 'unknown', location: 'uncategorized' };
}

async function main() {
  console.log('JSX Location Linter');
  console.log('===================\n');

  // Find all TSX files
  const allTsxFiles = await glob('src/**/*.tsx', { cwd: ROOT_DIR });

  const results = {
    approved: [],
    legacy: [],
    warning: [],
    violation: [],
    unknown: [],
  };

  for (const file of allTsxFiles) {
    const fullPath = path.join(ROOT_DIR, file);

    if (!containsJSX(fullPath)) {
      continue; // Skip TSX files that don't actually contain JSX
    }

    const { category, location } = categorizeFile(fullPath);
    results[category].push({ file, location });
  }

  // Report violations first
  if (results.violation.length > 0) {
    console.log('❌ VIOLATIONS (JSX in forbidden locations):');
    console.log('--------------------------------------------');
    results.violation.forEach(({ file, location }) => {
      console.log(`  ${file}`);
      console.log(`    → ${location}`);
    });
    console.log();
  }

  // Report warnings
  if (results.warning.length > 0) {
    console.log('⚠️  WARNINGS (needs attention):');
    console.log('-------------------------------');
    results.warning.forEach(({ file, location }) => {
      console.log(`  ${file}`);
      console.log(`    → ${location}`);
    });
    console.log();
  }

  // Report legacy
  if (results.legacy.length > 0) {
    console.log('📦 LEGACY (migrate to shared/ui):');
    console.log('----------------------------------');
    results.legacy.forEach(({ file }) => {
      console.log(`  ${file}`);
    });
    console.log();
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log('-----------');
  console.log(`  ✅ Approved:   ${results.approved.length} files`);
  console.log(`  📦 Legacy:     ${results.legacy.length} files (need migration)`);
  console.log(`  ⚠️  Warnings:   ${results.warning.length} files`);
  console.log(`  ❌ Violations: ${results.violation.length} files`);
  if (results.unknown.length > 0) {
    console.log(`  ❓ Unknown:    ${results.unknown.length} files`);
  }

  // Exit with error if violations found
  if (results.violation.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
