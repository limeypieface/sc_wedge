# Purchase Order Prototype - Sindri-Aligned

A standalone prototype for Purchase Order management workflows, structured to mirror Sindri's architecture for easy future integration.

## Purpose

This prototype demonstrates:
- PO revision and approval workflows
- Multi-level approval chains with cost thresholds
- Vendor communication workflows
- PDF generation for supplier contracts
- AI-powered insights integration

## Architecture Overview

```
sindri-prototype/
├── src/
│   ├── app/
│   │   └── supply/
│   │       └── purchase-orders/     # PO feature module (Sindri pattern)
│   │           ├── _components/     # Feature-specific components
│   │           ├── _hooks/          # Feature-specific hooks
│   │           ├── _lib/            # Feature-specific logic
│   │           │   ├── contexts/    # PO-specific contexts
│   │           │   ├── types/       # PO-specific types
│   │           │   └── utils/       # PO-specific utilities
│   │           └── _adapters/       # Data adapters (mock GraphQL)
│   │
│   ├── components/                  # Shared components
│   │   ├── ui/                     # Base UI components (shadcn)
│   │   ├── icons/                  # Icon components
│   │   ├── left-nav/               # Navigation sidebar
│   │   ├── data-table/             # Reusable table system
│   │   └── forms/                  # Shared form components
│   │
│   ├── context/                    # Global application contexts
│   ├── types/                      # Global type definitions
│   │   └── enums/                  # Enum definitions with metadata
│   ├── lib/                        # Shared utilities
│   │   ├── utils/                  # General utilities
│   │   ├── clients/                # API clients (mock)
│   │   └── mock-data/              # Mock data sources
│   │
│   ├── hooks/                      # Global custom hooks
│   └── config/                     # Application configuration
│
└── __tests__/                      # Test files
    ├── unit/                       # Unit tests
    └── mocks/                      # Mock utilities
```

## Key Design Decisions

### 1. Feature Module Pattern (Sindri-aligned)

Each feature is self-contained with:
- `_components/` - UI components specific to the feature
- `_hooks/` - Custom hooks for the feature
- `_lib/` - Business logic, types, and utilities
- `_adapters/` - Data access layer (mock GraphQL in prototype)

### 2. Data Adapter Pattern

All data access goes through adapters that simulate GraphQL operations:
```typescript
// In production Sindri, this would be real GraphQL queries
const { data, loading, error } = usePurchaseOrderQuery(poNumber);

// In prototype, same interface backed by mock data
const { data, loading, error } = usePurchaseOrderQuery(poNumber);
```

### 3. State Management

| State Type | Location | Example |
|------------|----------|---------|
| Server State | Adapters/Queries | PO data, line items |
| Feature State | Feature Contexts | Revision workflow, approval chain |
| UI State | Component Local | Modal open, selected tab |
| Global State | Global Contexts | Current user, chat visibility |

### 4. Approval Workflow

The approval system uses threshold-based rules:
```typescript
ApprovalConfig = {
  percentageThreshold: 0.05,  // 5% cost change
  absoluteThreshold: 500,     // $500 cost change
  mode: 'OR'                  // Either threshold triggers approval
}
```

## Mapping to Sindri

| Prototype Location | Sindri Location |
|-------------------|-----------------|
| `src/app/supply/purchase-orders/` | `src/app/supply/purchase-orders/` |
| `src/components/ui/` | `src/components/ui/` |
| `src/context/` | `src/context/` |
| `src/types/enums/` | `src/types/enums/` |
| `_adapters/*.mock.ts` | `_queries/*.generated.ts` |

## Migration Path

When integrating into Sindri:

1. **Replace adapters** - Swap mock adapters for real GraphQL queries
2. **Connect auth** - Use Sindri's AuthContext instead of mock user
3. **Add mutations** - Convert local state changes to GraphQL mutations
4. **Update imports** - Point to Sindri's shared components

## Running the Prototype

This prototype runs independently:
```bash
cd sindri-prototype
npm install
npm run dev
```

## Key Files

- `src/app/supply/purchase-orders/_lib/contexts/revision-context.tsx` - Core workflow logic
- `src/app/supply/purchase-orders/_adapters/purchase-order.adapter.ts` - Data access
- `src/types/enums/` - All status enums with metadata
