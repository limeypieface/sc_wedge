/**
 * UI Test Utilities
 *
 * Provides custom render functions, mock data factories, and test helpers
 * for comprehensive UI component testing.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock provider components for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const MockFeatureFlagsProvider = ({
  children,
  initialOverrides: _initialOverrides
}: {
  children: React.ReactNode;
  initialOverrides?: Record<string, boolean>;
}) => <>{children}</>;

// ============================================================================
// CUSTOM RENDER WITH PROVIDERS
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Wrap component with AuthProvider */
  withAuth?: boolean;
  /** Wrap component with FeatureFlagsProvider */
  withFeatureFlags?: boolean;
  /** Initial feature flag overrides */
  featureFlagOverrides?: Record<string, boolean>;
}

interface CustomRenderResult extends RenderResult {
  /** Pre-configured userEvent instance */
  user: ReturnType<typeof userEvent.setup>;
}

/**
 * Custom render function that wraps components with necessary providers.
 *
 * @example
 * ```tsx
 * const { user } = renderWithProviders(<MyComponent />, { withAuth: true });
 * await user.click(screen.getByRole('button'));
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const {
    withAuth = false,
    withFeatureFlags = false,
    featureFlagOverrides = {},
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    let element = <>{children}</>;

    if (withFeatureFlags) {
      element = (
        <MockFeatureFlagsProvider initialOverrides={featureFlagOverrides}>
          {element}
        </MockFeatureFlagsProvider>
      );
    }

    if (withAuth) {
      element = <MockAuthProvider>{element}</MockAuthProvider>;
    }

    return element;
  }

  const user = userEvent.setup();
  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    user,
  };
}

/**
 * Simple render with userEvent setup (no providers).
 */
export function renderWithUser(ui: ReactElement, options?: RenderOptions): CustomRenderResult {
  const user = userEvent.setup();
  const renderResult = render(ui, options);
  return { ...renderResult, user };
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Creates a mock PO line item with sensible defaults.
 */
export function createMockPOLineItem(overrides: Partial<MockPOLineItem> = {}): MockPOLineItem {
  return {
    id: 1,
    lineNumber: 1,
    sku: 'SKU-001',
    name: 'Test Item',
    description: 'A test item for unit testing',
    lineType: 'Material',
    status: 'open',
    quantityOrdered: 100,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityInQualityHold: 0,
    quantityPaid: 0,
    quantityRejected: 0,
    quantityCancelled: 0,
    unitPrice: 25.0,
    lineTotal: 2500.0,
    discountPercent: 0,
    discountAmount: 0,
    taxRate: 0.0825,
    taxAmount: 206.25,
    lineTotalWithTax: 2706.25,
    promisedDate: 'Jan 15, 2026',
    needByDate: 'Jan 20, 2026',
    ...overrides,
  };
}

export interface MockPOLineItem {
  id: number;
  lineNumber: number;
  sku: string;
  name: string;
  description?: string;
  lineType: 'Material' | 'Service';
  status: string;
  quantityOrdered: number;
  quantityShipped: number;
  quantityReceived: number;
  quantityInQualityHold: number;
  quantityPaid: number;
  quantityRejected: number;
  quantityCancelled: number;
  unitPrice: number;
  lineTotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotalWithTax: number;
  promisedDate: string;
  needByDate?: string;
  serviceDetails?: {
    category?: string;
    milestones?: Array<{ name: string; status: string }>;
  };
}

/**
 * Creates a mock RMA with sensible defaults.
 */
export function createMockRMA(overrides: Partial<MockRMA> = {}): MockRMA {
  return {
    id: 'rma-1',
    rmaNumber: 'RMA-2026-001',
    orderNumber: 'PO-2026-001',
    lineNumber: 1,
    status: 'requested',
    reason: 'defective',
    quantity: 10,
    requestedBy: 'John Doe',
    requestedDate: '2026-01-10',
    supplierContact: 'Jane Smith',
    supplierEmail: 'jane@supplier.com',
    notes: 'Item arrived damaged',
    ...overrides,
  };
}

export interface MockRMA {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  lineNumber: number;
  status: 'requested' | 'authorized' | 'shipped' | 'received' | 'resolved' | 'closed';
  reason: string;
  quantity: number;
  requestedBy: string;
  requestedDate: string;
  supplierContact?: string;
  supplierEmail?: string;
  notes?: string;
  authorizationNumber?: string;
  resolution?: string;
}

/**
 * Creates a mock PO header with sensible defaults.
 */
export function createMockPOHeader(overrides: Partial<MockPOHeader> = {}): MockPOHeader {
  return {
    poNumber: 'PO-2026-00142',
    revision: 'A',
    status: 'open',
    supplier: {
      id: 'SUP-001',
      name: 'Acme Supplies Inc.',
      code: 'ACME',
    },
    buyer: 'John Buyer',
    dates: {
      created: '2026-01-01',
      promised: '2026-02-15',
      lastModified: '2026-01-10',
    },
    currency: 'USD',
    payment: {
      terms: 'Net 30',
    },
    shipping: {
      method: 'Ground',
      destination: 'Main Warehouse',
    },
    totals: {
      subtotal: 10000.0,
      discount: 500.0,
      tax: 783.75,
      shipping: 150.0,
      total: 10433.75,
    },
    ...overrides,
  };
}

export interface MockPOHeader {
  poNumber: string;
  revision: string;
  status: string;
  supplier: {
    id: string;
    name: string;
    code?: string;
  };
  buyer: string;
  dates: {
    created: string;
    promised: string;
    lastModified?: string;
  };
  currency: string;
  payment: {
    terms: string;
  };
  shipping: {
    method: string;
    destination?: string;
  };
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

/**
 * Creates a mock approval request with sensible defaults.
 */
export function createMockApproval(overrides: Partial<MockApproval> = {}): MockApproval {
  return {
    id: 'approval-1',
    type: 'revision',
    status: 'pending',
    requestedBy: 'John Doe',
    requestedAt: '2026-01-10T10:00:00Z',
    approvers: [
      { id: 'user-1', name: 'Alice Manager', status: 'pending' },
      { id: 'user-2', name: 'Bob Director', status: 'pending' },
    ],
    threshold: 5000,
    currentValue: 7500,
    ...overrides,
  };
}

export interface MockApproval {
  id: string;
  type: 'revision' | 'new' | 'change';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  approvers: Array<{
    id: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    decidedAt?: string;
  }>;
  threshold?: number;
  currentValue?: number;
}

/**
 * Creates a mock user with sensible defaults.
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    company: 'Test Corp',
    isStaff: false,
    ...overrides,
  };
}

export interface MockUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  isStaff?: boolean;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Waits for a condition to be true, with timeout.
 */
export async function waitForCondition(
  condition: () => boolean,
  { timeout = 1000, interval = 50 } = {}
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Creates a deferred promise for controlling async test flow.
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Suppresses console errors for a test block.
 * Useful when testing error boundaries or expected errors.
 */
export function suppressConsoleErrors(): () => void {
  const originalError = console.error;
  console.error = () => {};
  return () => {
    console.error = originalError;
  };
}

/**
 * Creates a mock function that tracks calls and can be configured.
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>() {
  return vi.fn() as ReturnType<typeof vi.fn>;
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Checks that an element is keyboard focusable.
 */
export function expectKeyboardFocusable(element: HTMLElement): void {
  expect(element.tabIndex).toBeGreaterThanOrEqual(0);
}

/**
 * Checks that an element has the required ARIA attributes for accessibility.
 */
export function expectAccessibleName(element: HTMLElement): void {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  const hasTitle = element.hasAttribute('title');
  const hasVisibleLabel =
    element.textContent !== null && element.textContent.trim().length > 0;

  expect(hasAriaLabel || hasAriaLabelledBy || hasTitle || hasVisibleLabel).toBe(true);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export testing library utilities for convenience
export { screen, within, waitFor, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
