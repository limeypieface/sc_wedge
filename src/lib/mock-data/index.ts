/**
 * Mock Data - Unified Export
 *
 * This is the main entry point for all mock data.
 * Import from here for clean, organized access to domain-specific data.
 *
 * Usage:
 *   import { poApprovers, getPOData } from "@/lib/mock-data"
 *   import * as poData from "@/lib/mock-data/po"
 *   import * as soData from "@/lib/mock-data/so"
 */

// Re-export shared data (foundation)
export * from "./shared"
export * from "./config"

// Named domain exports for clarity (to avoid conflicts)
import * as poMockData from "./po"
import * as soMockData from "./so"
import * as sharedMockData from "./shared"
import * as configData from "./config"

export { poMockData, soMockData, sharedMockData, configData }

// Explicit PO exports (avoiding conflicts with shared)
export {
  poHeader,
  lineItems,
  initialRevisions as poRevisions,
  computePOTotals,
  getPOData,
} from "./po"

// SO exports should come from so module when needed
// Use soMockData namespace for SO-specific items
