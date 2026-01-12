# Migration Guide: Prototype to Sindri

This guide explains how to migrate this prototype into the Sindri codebase.

## Overview

The prototype is structured to mirror Sindri's patterns, making migration straightforward. The key changes are:

1. Replace mock adapters with GraphQL queries
2. Connect to Sindri's authentication
3. Use Sindri's shared components
4. Add real mutations for state changes

## Step-by-Step Migration

### 1. Copy Directory Structure

Copy the feature module into Sindri:

```bash
# From prototype
cp -r src/app/supply/purchase-orders/* \
  <sindri>/frontend/src/app/supply/purchase-orders/
```

The directory structure already matches Sindri's conventions.

### 2. Replace Adapters with GraphQL

#### Before (Prototype)
```typescript
// _adapters/purchase-order.adapter.ts
export async function fetchPurchaseOrder(poNumber: string) {
  await simulateDelay();
  return mockData;
}
```

#### After (Sindri)
```typescript
// _queries/purchase-order.graphql
query PurchaseOrder($orderNumber: String!) {
  purchaseOrder(orderNumber: $orderNumber) {
    id
    poNumber
    poType
    status
    lineItems {
      id
      sku
      quantity
      unitPrice
      lineType
      serviceDetails {
        billingType
        category
        progress {
          percentComplete
          consumedUnits
          estimatedUnits
        }
        milestones {
          id
          name
          amount
          status
        }
      }
    }
    blanketTerms {
      authorizedTotal
      expirationDate
      perReleaseLimit
    }
    utilization {
      released
      consumed
      available
    }
    # ... other fields
  }
}
```

```typescript
// _queries/purchase-order.generated.ts (auto-generated)
export function usePurchaseOrderQuery(options: QueryOptions) {
  return useQuery(PURCHASE_ORDER_QUERY, options);
}
```

### 3. Update Hooks to Use GraphQL

#### Before (Prototype)
```typescript
// _hooks/use-purchase-order.ts
export function usePurchaseOrder(poNumber: string) {
  const [data, setData] = useState<PurchaseOrder>();

  useEffect(() => {
    fetchPurchaseOrder(poNumber).then(setData);
  }, [poNumber]);

  return { purchaseOrder: data, loading, error };
}
```

#### After (Sindri)
```typescript
// _hooks/use-purchase-order.ts
import { usePurchaseOrderQuery } from "../_queries/purchase-order.generated";

export function usePurchaseOrder(poNumber: string) {
  const { data, loading, error } = usePurchaseOrderQuery({
    variables: { orderNumber: poNumber },
  });

  return {
    purchaseOrder: data?.purchaseOrder,
    loading,
    error
  };
}
```

### 4. Replace Context State with Apollo Cache

The RevisionContext manages local state. In Sindri, some of this would be:
- Server state (revisions, approval chains) → Apollo cache
- UI state (edit mode, selected revision) → local React state

#### Example: Approval Actions

```typescript
// Before: Local state update
const approveRevision = async () => {
  const updated = await approveAdapter(revisionId, notes);
  setPendingDraftRevision(updated);
};

// After: GraphQL mutation
const [approveRevision] = useApproveRevisionMutation({
  onCompleted: (data) => {
    // Apollo cache is automatically updated
  },
});
```

### 5. Connect to Authentication

#### Before (Prototype)
```typescript
const [currentUser, setCurrentUser] = useState(mockUser);
```

#### After (Sindri)
```typescript
import { useAuth } from "@/context/AuthContext";

const { user } = useAuth();
```

### 6. Use Sindri's Shared Components

Replace prototype components with Sindri equivalents:

| Prototype | Sindri |
|-----------|--------|
| `@/components/ui/button` | `@/components/ui/button` (same) |
| `@/components/ui/table` | `@/components/data-table` |
| Custom Badge | `@/components/ui/badge` |

### 7. Type Alignment

The prototype types are manually defined. In Sindri:

1. Define GraphQL schema
2. Run code generator: `npm run codegen`
3. Import generated types

```typescript
// Before: Manual types
interface PORevision {
  id: string;
  version: string;
  // ...
}

// After: Generated types
import type { PORevision } from "@/lib/graphql/api-types.generated";
```

## Service Lines Migration

### GraphQL Schema Extensions

Add service line fields to your GraphQL schema:

```graphql
enum LineType {
  ITEM
  SERVICE
  NRE
}

enum ServiceBillingType {
  FIXED_PRICE
  T_AND_M
  MILESTONE
}

enum ServiceLineStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  PENDING_APPROVAL
  APPROVED
  COMPLETED
  CANCELLED
}

type ServiceProgress {
  percentComplete: Float!
  estimatedUnits: Float!
  consumedUnits: Float!
  unitType: String!
  lastUpdated: DateTime
  notes: String
}

type MilestoneItem {
  id: ID!
  name: String!
  description: String
  amount: Float!
  dueDate: Date
  status: String!
  completedDate: DateTime
  approvedBy: String
}

type ServiceLineDetails {
  billingType: ServiceBillingType!
  category: String!
  progress: ServiceProgress!
  milestones: [MilestoneItem!]
  rate: Float
  rateUnit: String
  nteAmount: Float
  sowReference: String
  serviceStartDate: Date
  serviceEndDate: Date
}

extend type LineItem {
  lineType: LineType
  serviceDetails: ServiceLineDetails
  serviceStatus: ServiceLineStatus
}
```

### Mutations for Service Lines

```graphql
mutation UpdateServiceProgress($lineId: ID!, $input: ServiceProgressInput!) {
  updateServiceProgress(lineId: $lineId, input: $input) {
    id
    serviceDetails {
      progress {
        percentComplete
        consumedUnits
      }
    }
  }
}

mutation UpdateMilestoneStatus($milestoneId: ID!, $status: String!) {
  updateMilestoneStatus(milestoneId: $milestoneId, status: $status) {
    id
    status
    completedDate
  }
}
```

### Component Migration

The service line components can be used directly:

| Component | Notes |
|-----------|-------|
| `service-progress-editor.tsx` | Uses local state, convert `onSave` to mutation |
| `milestone-editor.tsx` | Update to use GraphQL mutations for status changes |
| `add-line-modal.tsx` | Service tab already included, wire to create mutation |

## Blanket PO Migration

### GraphQL Schema Extensions

```graphql
enum POType {
  STANDARD
  BLANKET
  RELEASE
}

type BlanketPOTerms {
  effectiveDate: Date!
  expirationDate: Date!
  authorizedTotal: Float!
  perReleaseLimit: Float
  perReleaseMinimum: Float
  maxReleases: Int
}

type BlanketUtilization {
  committed: Float!
  released: Float!
  consumed: Float!
  available: Float!
  releaseCount: Int!
}

extend type PurchaseOrder {
  poType: POType!
  blanketTerms: BlanketPOTerms
  utilization: BlanketUtilization
  parentBlanketPO: String
  releaseNumber: Int
}
```

### Mutations for Blanket POs

```graphql
mutation CreateRelease($blanketPOId: ID!, $input: CreateReleaseInput!) {
  createRelease(blanketPOId: $blanketPOId, input: $input) {
    id
    poNumber
    releaseNumber
    lineItems {
      id
      quantity
    }
  }
}

input CreateReleaseInput {
  lines: [ReleaseLineInput!]!
  requestedDelivery: Date
  notes: String
}

input ReleaseLineInput {
  blanketLineId: ID!
  releaseQuantity: Float!
  requestedDelivery: Date
}
```

### Component Migration

| Component | Notes |
|-----------|-------|
| `blanket-utilization-card.tsx` | Wire `onCreateRelease` to open release modal |
| `create-release-modal.tsx` | Convert `onCreateRelease` to GraphQL mutation |
| `release-history-panel.tsx` | Fetch releases from GraphQL query |

## File Mapping

| Prototype | Sindri |
|-----------|--------|
| `_adapters/*.adapter.ts` | `_queries/*.graphql` |
| `_hooks/use-*.ts` | `_hooks/use-*.ts` (uses generated hooks) |
| `_lib/types/*.ts` | `@/lib/graphql/api-types.generated.ts` |
| `_lib/contexts/*.tsx` | `_lib/contexts/*.tsx` (simplified) |
| `_components/*` | `_components/*` (same structure) |
| `src/types/enums/*` | `src/types/enums/*` (same structure) |

## Enum Migration

The enums in `src/types/enums/` include metadata (labels, descriptions). These can be:

1. **Kept as-is**: Use prototype enums for display logic
2. **Split**: GraphQL enums for data, separate display config
3. **Backend-driven**: Fetch enum metadata from API

Recommended approach: Keep prototype enums for now, refactor later if needed.

## Testing Migration

1. Run prototype tests (when added)
2. Verify GraphQL queries match expected shape
3. Test approval workflow end-to-end
4. Verify permissions work with real auth
5. Test service line workflows (progress, milestones)
6. Test blanket PO workflows (releases, validation)

## Checklist

### Core Migration
- [ ] Copy feature directory
- [ ] Create GraphQL queries
- [ ] Run code generator
- [ ] Update hooks to use generated queries
- [ ] Create GraphQL mutations
- [ ] Simplify context (remove server state)
- [ ] Connect authentication
- [ ] Replace shared components
- [ ] Update imports

### Service Lines
- [ ] Add service line types to GraphQL schema
- [ ] Create service progress mutation
- [ ] Create milestone update mutation
- [ ] Wire ServiceProgressEditor to mutation
- [ ] Wire MilestoneEditor to mutation
- [ ] Test service line creation
- [ ] Test progress tracking
- [ ] Test milestone workflow

### Blanket POs
- [ ] Add blanket PO types to GraphQL schema
- [ ] Create release creation mutation
- [ ] Wire CreateReleaseModal to mutation
- [ ] Wire ReleaseHistoryPanel to query
- [ ] Test release creation
- [ ] Test utilization updates
- [ ] Test validation (limits, expiration)

### Final Steps
- [ ] Add E2E tests
- [ ] Test with real backend
- [ ] Performance testing
- [ ] Accessibility audit
