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
    status
    lineItems {
      id
      sku
      quantity
      unitPrice
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

## File Mapping

| Prototype | Sindri |
|-----------|--------|
| `_adapters/*.adapter.ts` | `_queries/*.graphql` |
| `_hooks/use-*.ts` | `_hooks/use-*.ts` (uses generated hooks) |
| `_lib/types/*.ts` | `@/lib/graphql/api-types.generated.ts` |
| `_lib/contexts/*.tsx` | `_lib/contexts/*.tsx` (simplified) |
| `_components/*` | `_components/*` (same structure) |

## Testing Migration

1. Run prototype tests (when added)
2. Verify GraphQL queries match expected shape
3. Test approval workflow end-to-end
4. Verify permissions work with real auth

## Checklist

- [ ] Copy feature directory
- [ ] Create GraphQL queries
- [ ] Run code generator
- [ ] Update hooks to use generated queries
- [ ] Create GraphQL mutations
- [ ] Simplify context (remove server state)
- [ ] Connect authentication
- [ ] Replace shared components
- [ ] Update imports
- [ ] Add E2E tests
- [ ] Test with real backend
