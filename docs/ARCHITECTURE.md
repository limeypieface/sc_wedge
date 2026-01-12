# Architecture Overview

This document describes the architecture of the Purchase Order prototype.

## Design Principles

### 1. Modularity First

Every module answers one question. Components are small and focused.

```
revision-status-panel/
├── revision-status-panel.tsx    # Main container
├── workflow-progress.tsx        # Progress bar
├── cost-delta-indicator.tsx     # Cost change display
├── vendor-notification.tsx      # Notification prompt
├── approval-chain-display.tsx   # Approval progress
└── revision-actions.tsx         # Action buttons
```

### 2. Explicit Boundaries

Clear separation between:
- **UI Components**: Rendering logic only
- **State Management**: Contexts for shared state
- **Data Access**: Adapters for fetching data
- **Business Logic**: Type utilities and helpers

### 3. Interface-Driven Design

All data structures have explicit TypeScript interfaces:

```typescript
interface PORevision {
  id: string;
  version: string;
  status: RevisionStatus;
  // ... fully typed
}
```

### 4. Replaceability

Mock adapters can be replaced without touching UI:

```typescript
// Adapter returns same shape whether mock or GraphQL
interface QueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}
```

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                             │
│  Components that render UI. No business logic.              │
│  Import from: hooks, types, shared components               │
├─────────────────────────────────────────────────────────────┤
│                       HOOKS LAYER                           │
│  Custom hooks that manage data fetching and state.          │
│  Import from: adapters, types                               │
├─────────────────────────────────────────────────────────────┤
│                     CONTEXT LAYER                           │
│  React contexts for shared feature state.                   │
│  Import from: adapters, types                               │
├─────────────────────────────────────────────────────────────┤
│                     ADAPTER LAYER                           │
│  Data access abstraction. Mock in prototype, GraphQL in     │
│  production.                                                │
│  Import from: types, mock data                              │
├─────────────────────────────────────────────────────────────┤
│                      TYPE LAYER                             │
│  TypeScript interfaces and types. Pure data definitions.    │
│  No imports from other layers.                              │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### State Categories

| Category | Location | Example |
|----------|----------|---------|
| Server State | Adapters (Apollo in Sindri) | PO data, revisions |
| Feature State | Feature Contexts | Edit mode, approval workflow |
| UI State | Component Local | Modal open, selected tab |
| Global State | Global Contexts | Current user, chat |

### Revision Context State

```typescript
// User State
currentUser: CurrentUser
availableUsers: CurrentUser[]

// Revision State
activeRevision: PORevision | null      // What vendor sees
pendingDraftRevision: PORevision | null // Being edited
selectedRevision: PORevision | null     // For viewing history
revisionHistory: PORevision[]           // All versions

// Workflow State
isEditMode: boolean
requiresApproval: boolean
costDeltaInfo: CostDeltaInfo | null

// Computed Permissions
canEdit, canSubmit, canApprove, canSendToSupplier, canSkipApproval
```

## Data Flow

### Read Flow (Viewing PO)

```
1. Component mounts
2. usePurchaseOrder(poNumber) called
3. Hook calls fetchPurchaseOrder adapter
4. Adapter returns mock data (or GraphQL in Sindri)
5. Hook updates state
6. Component re-renders with data
```

### Write Flow (Making Changes)

```
1. User clicks "Edit"
2. enterEditMode() creates draft revision
3. User makes changes
4. addChangeToDraft() records changes
5. User clicks "Submit for Approval"
6. submitForApproval() updates status
7. Approval chain workflow begins
```

## Approval Workflow

```
┌──────────┐   ┌────────────────┐   ┌──────────┐   ┌──────┐   ┌────────┐
│  Draft   │──>│PendingApproval │──>│ Approved │──>│ Sent │──>│ Active │
└──────────┘   └────────────────┘   └──────────┘   └──────┘   └────────┘
     ▲                │
     │                │ Rejected
     │                ▼
     └────────────────┘
```

### Threshold-Based Approval

```typescript
ApprovalConfig = {
  percentageThreshold: 0.05,  // 5%
  absoluteThreshold: 500,     // $500
  mode: 'OR'                  // Either triggers approval
}
```

- Changes within threshold: Can skip approval
- Changes exceeding threshold: Must go through approval chain

## Line Types

### Type Discrimination

Lines are classified by `LineType` to handle different workflows:

```typescript
enum LineType {
  Item = "ITEM",       // Physical goods - uses receiving workflow
  Service = "SERVICE", // Services - uses completion workflow
  NRE = "NRE",        // Non-Recurring Engineering - special service type
}
```

### Item Lines vs Service Lines

| Aspect | Item Lines | Service Lines |
|--------|------------|---------------|
| Receiving | Physical receipt tracking | N/A |
| Progress | Quantity received | Percentage/units consumed |
| Completion | Fully received | Status: Completed/Approved |
| Billing | On receipt | Fixed/T&M/Milestone |

### Service Line Status Flow

```
┌─────────────┐   ┌─────────────┐   ┌──────────────────┐   ┌───────────┐   ┌───────────┐
│ NotStarted  │──>│ InProgress  │──>│ PendingApproval  │──>│ Approved  │──>│ Completed │
└─────────────┘   └─────────────┘   └──────────────────┘   └───────────┘   └───────────┘
                        │                                         │
                        │ OnHold                                  │
                        ▼                                         │
                  ┌──────────┐                                    │
                  │  OnHold  │────────────────────────────────────┘
                  └──────────┘
```

### Service Billing Types

```typescript
enum ServiceBillingType {
  FixedPrice = "FIXED_PRICE",        // Single total amount
  TimeAndMaterials = "T_AND_M",      // Rate * consumed units
  Milestone = "MILESTONE",           // Payment per milestone completion
}
```

## Blanket PO Architecture

### PO Type Discrimination

```typescript
enum POType {
  Standard = "STANDARD",  // Regular one-time PO
  Blanket = "BLANKET",   // Authorization for ongoing releases
  Release = "RELEASE",   // Individual release from blanket
}
```

### Blanket PO Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    BLANKET PO (Parent)                       │
│  - Authorized Total: $500,000                               │
│  - Effective: Jan 1 - Dec 31                                │
│  - Per-Release Limit: $50,000                               │
├─────────────────────────────────────────────────────────────┤
│  Utilization:                                               │
│  ┌─────────┬─────────┬──────────┬───────────┐              │
│  │Consumed │Released │Committed │ Available │              │
│  │ $98,000 │$125,000 │ $75,000  │ $300,000  │              │
│  └─────────┴─────────┴──────────┴───────────┘              │
├─────────────────────────────────────────────────────────────┤
│  Line Items (Available for Release):                        │
│  - Item A: 1000 units @ $50 (500 available)                 │
│  - Item B: 500 units @ $100 (250 available)                 │
│  - Service C: NRE @ $15,000 (1 available)                   │
└─────────────────────────────────────────────────────────────┘
           │
           │ Create Release
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RELEASE PO (Child)                        │
│  - Parent: BPO-2026-0001                                    │
│  - Release #: 6                                             │
│  - Amount: $25,000                                          │
│  - Lines selected from parent                               │
└─────────────────────────────────────────────────────────────┘
```

### Utilization Calculation

```typescript
interface BlanketUtilization {
  committed: number;   // Unreleased line amounts on blanket
  released: number;    // Sum of all release totals
  consumed: number;    // Invoiced/paid against releases
  available: number;   // authorizedTotal - released - committed
  releaseCount: number;
}
```

### Release Validation

Before creating a release:
1. Check blanket is not expired
2. Validate release amount <= per-release limit
3. Verify release amount <= available balance
4. Check release count < max releases (if configured)

## File Organization

```
src/app/supply/purchase-orders/
├── _components/               # Feature components
│   └── revision-status-panel/
│       ├── index.ts           # Public exports
│       ├── revision-status-panel.tsx
│       └── [sub-components].tsx
├── _hooks/                    # Feature hooks
│   ├── index.ts
│   ├── use-purchase-order.ts
│   └── use-revisions.ts
├── _lib/                      # Feature logic
│   ├── contexts/
│   │   └── revision-context.tsx
│   ├── types/
│   │   ├── purchase-order.types.ts   # Extended with service fields
│   │   ├── blanket-po.types.ts       # Blanket PO types
│   │   ├── approval.types.ts
│   │   └── revision.types.ts
│   └── utils/
├── _adapters/                 # Data access
│   ├── purchase-order.adapter.ts
│   └── revision.adapter.ts
├── [poNumber]/               # Dynamic route
│   └── page.tsx
└── page.tsx                  # List page
```

### Shared Components

```
src/components/
├── service-progress-editor.tsx    # Service progress tracking
├── milestone-editor.tsx           # Milestone management
├── blanket-utilization-card.tsx   # Blanket usage visualization
├── create-release-modal.tsx       # Release creation wizard
├── release-history-panel.tsx      # Release list with filters
├── add-line-modal.tsx            # Line creation (includes Service tab)
├── po-lines-table.tsx            # Lines table (includes services view)
└── line-display-selector.tsx     # View mode selector
```

### Enum Files

```
src/types/enums/
├── index.ts                  # Re-exports all enums
├── line-type.ts             # LineType, ServiceBillingType + metadata
├── service-line-status.ts   # ServiceLineStatus + transitions
├── po-type.ts               # POType enum
├── po-status.ts             # POStatus enum
└── [other-enums].ts
```

## Component Patterns

### Compound Components

Large components are split into sub-components:

```typescript
// revision-status-panel/index.ts
export { RevisionStatusPanel } from "./revision-status-panel";
export { WorkflowProgress } from "./workflow-progress";
export { CostDeltaIndicator } from "./cost-delta-indicator";
// ...
```

### Props Documentation

Every component documents its props:

```typescript
interface RevisionStatusPanelProps {
  /** Callback when submitting for approval */
  onSubmitForApproval?: () => void;

  /** Callback when sending to supplier */
  onSendToSupplier?: () => void;
}
```

### Error Boundaries

Components should handle their own errors:

```typescript
if (error) {
  return <ErrorDisplay error={error} onRetry={refetch} />;
}
```

## Testing Strategy

### Unit Tests
- Adapter functions
- Utility functions
- Type validation
- Service progress calculations
- Blanket utilization calculations

### Component Tests
- Render with mock data
- User interactions
- State changes
- Service line workflows
- Blanket PO workflows

### Integration Tests
- Full workflow (draft → approve → send)
- Permission checks
- Error handling
- Service completion workflow
- Release creation workflow
