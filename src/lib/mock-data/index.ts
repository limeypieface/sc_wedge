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

// Re-export all domains
export * from "./shared"
export * from "./config"
export * from "./po"
export * from "./so"

// Named domain exports for clarity
import * as poMockData from "./po"
import * as soMockData from "./so"
import * as sharedMockData from "./shared"
import * as configData from "./config"

export { poMockData, soMockData, sharedMockData, configData }
