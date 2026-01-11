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
│   │   ├── purchase-order.types.ts
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

### Component Tests
- Render with mock data
- User interactions
- State changes

### Integration Tests
- Full workflow (draft → approve → send)
- Permission checks
- Error handling
