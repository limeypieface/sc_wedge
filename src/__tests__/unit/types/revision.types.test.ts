/**
 * Revision Types Tests
 *
 * Tests for revision-related utility functions.
 */

import {
  parseVersion,
  getNextVersion,
  compareVersions,
  isCriticalEdit,
  CRITICAL_EDIT_FIELDS,
  NON_CRITICAL_EDIT_FIELDS,
} from '../../../app/supply/purchase-orders/_lib/types/revision.types';

describe('Revision Types', () => {
  describe('parseVersion', () => {
    it('should parse major.minor version', () => {
      const result = parseVersion('2.1');

      expect(result.major).toBe(2);
      expect(result.minor).toBe(1);
    });

    it('should parse whole number version', () => {
      const result = parseVersion('3.0');

      expect(result.major).toBe(3);
      expect(result.minor).toBe(0);
    });

    it('should handle version 1.0', () => {
      const result = parseVersion('1.0');

      expect(result.major).toBe(1);
      expect(result.minor).toBe(0);
    });

    it('should handle high minor version', () => {
      const result = parseVersion('1.15');

      expect(result.major).toBe(1);
      expect(result.minor).toBe(15);
    });
  });

  describe('getNextVersion', () => {
    it('should increment major version for critical edits', () => {
      expect(getNextVersion('1.0', 'critical')).toBe('2.0');
      expect(getNextVersion('2.5', 'critical')).toBe('3.0');
    });

    it('should reset minor to 0 for critical edits', () => {
      const result = getNextVersion('1.3', 'critical');

      expect(result).toBe('2.0');
    });

    it('should increment minor version for non-critical edits', () => {
      expect(getNextVersion('1.0', 'non_critical')).toBe('1.1');
      expect(getNextVersion('2.5', 'non_critical')).toBe('2.6');
    });

    it('should preserve major version for non-critical edits', () => {
      const result = getNextVersion('3.2', 'non_critical');

      expect(result).toBe('3.3');
    });
  });

  describe('compareVersions', () => {
    it('should return negative when a < b', () => {
      expect(compareVersions('1.0', '2.0')).toBeLessThan(0);
      expect(compareVersions('1.0', '1.1')).toBeLessThan(0);
    });

    it('should return positive when a > b', () => {
      expect(compareVersions('2.0', '1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.5', '1.2')).toBeGreaterThan(0);
    });

    it('should return 0 when equal', () => {
      expect(compareVersions('1.0', '1.0')).toBe(0);
      expect(compareVersions('2.5', '2.5')).toBe(0);
    });

    it('should compare major version first', () => {
      expect(compareVersions('2.0', '1.9')).toBeGreaterThan(0);
    });

    it('should compare minor version when major is equal', () => {
      expect(compareVersions('1.2', '1.1')).toBeGreaterThan(0);
    });
  });

  describe('isCriticalEdit', () => {
    it('should return true for critical fields', () => {
      expect(isCriticalEdit('quantity')).toBe(true);
      expect(isCriticalEdit('unitPrice')).toBe(true);
      expect(isCriticalEdit('lineTotal')).toBe(true);
      expect(isCriticalEdit('addLine')).toBe(true);
      expect(isCriticalEdit('removeLine')).toBe(true);
    });

    it('should return false for non-critical fields', () => {
      expect(isCriticalEdit('notes')).toBe(false);
      expect(isCriticalEdit('promisedDate')).toBe(false);
      expect(isCriticalEdit('projectCode')).toBe(false);
    });

    it('should return false for unknown fields', () => {
      expect(isCriticalEdit('unknownField')).toBe(false);
    });
  });

  describe('Field Constants', () => {
    it('should have critical edit fields defined', () => {
      expect(CRITICAL_EDIT_FIELDS).toContain('quantity');
      expect(CRITICAL_EDIT_FIELDS).toContain('unitPrice');
      expect(CRITICAL_EDIT_FIELDS.length).toBeGreaterThan(0);
    });

    it('should have non-critical edit fields defined', () => {
      expect(NON_CRITICAL_EDIT_FIELDS).toContain('notes');
      expect(NON_CRITICAL_EDIT_FIELDS).toContain('promisedDate');
      expect(NON_CRITICAL_EDIT_FIELDS.length).toBeGreaterThan(0);
    });

    it('should not have overlap between critical and non-critical', () => {
      const criticalSet = new Set(CRITICAL_EDIT_FIELDS);
      const overlap = NON_CRITICAL_EDIT_FIELDS.filter(f => criticalSet.has(f as any));

      expect(overlap).toHaveLength(0);
    });
  });
});
