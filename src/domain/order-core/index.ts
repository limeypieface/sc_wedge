/**
 * Order Core - Public API
 *
 * Shared abstractions for all order types (Purchase Orders, Sales Orders, etc.)
 * This module provides the foundation that order-specific implementations extend.
 *
 * Usage:
 *   import { BaseOrder, OrderTypeConfig, calculateOrderTotals } from '@/domain/order-core';
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Direction
  OrderDirection,

  // Parties
  OrderParty,
  OrderAddress,
  OrderContact,

  // Line Items
  BaseLineItem,
  ScheduledLineItem,

  // Status
  BaseOrderStatus,
  OrderStatusMeta,

  // Order Document
  BaseOrder,

  // Configuration
  OrderTypeConfig,
  OrderTerminology,
  OrderApprovalConfig,
  ApprovalLevelConfig,

  // Events
  OrderEventType,
  OrderEvent,

  // Utility Types
  LineItemOf,
  PartyOf,
  StatusOf,
} from "./types";

// =============================================================================
// CALCULATIONS
// =============================================================================

export type {
  OrderTotals,
  CostDelta,
  OrderValidation,
  OrderValidationError,
  OrderValidationWarning,
} from "./calculations";

export {
  // Line calculations
  calculateLineTotal,
  calculateLineTax,
  computeLineItem,

  // Order totals
  calculateOrderTotals,

  // Variance
  calculateCostDelta,
  exceedsThreshold,

  // Order numbers
  generateOrderNumber,

  // Validation
  validateOrder,
} from "./calculations";
