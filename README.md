# Purchase Order Prototype - Sindri-Aligned

A standalone prototype for Purchase Order management workflows, structured to mirror Sindri's architecture for easy future integration.

## Purpose

This prototype demonstrates:
- PO revision and approval workflows
- Multi-level approval chains with cost thresholds
- Vendor communication workflows
- PDF generation for supplier contracts
- AI-powered insights integration
- **Service line items** (NRE, consulting, time & materials)
- **Blanket purchase orders** with release tracking

## Features

### Standard PO Functionality
- Line item management with catalog and requisition sources
- Multi-step approval workflows with threshold-based rules
- Revision history and version control
- Vendor notification and acknowledgment tracking

### Service Lines
Service lines support non-physical goods such as NRE, consulting, and maintenance:

| Billing Type | Description |
|--------------|-------------|
| **Fixed Price** | Single total amount for the service |
| **Time & Materials** | Hourly/daily rate with not-to-exceed limits |
| **Milestone** | Payment tied to deliverable completion |

Service lines include:
- Progress tracking (percentage and hours/units consumed)
- Milestone management with status transitions
- Configurable service categories
- Separate approval workflow from receiving

### Blanket Purchase Orders
Blanket POs allow ongoing releases against an authorized total:

- **Terms**: Effective/expiration dates, authorized total, per-release limits
- **Utilization tracking**: Committed, released, consumed, and available amounts
- **Manual releases**: Create releases selecting lines and quantities
- **Release history**: Full audit trail of all releases

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
│   │   ├── forms/                  # Shared form components
│   │   ├── service-progress-editor.tsx    # Service progress UI
│   │   ├── milestone-editor.tsx           # Milestone management
│   │   ├── blanket-utilization-card.tsx   # Blanket usage display
│   │   ├── create-release-modal.tsx       # Release creation wizard
│   │   └── release-history-panel.tsx      # Release list panel
│   │
│   ├── context/                    # Global application contexts
│   ├── types/                      # Global type definitions
│   │   └── enums/                  # Enum definitions with metadata
│   │       ├── line-type.ts        # LineType, ServiceBillingType
│   │       ├── service-line-status.ts  # ServiceLineStatus
│   │       └── po-type.ts          # POType (Standard/Blanket/Release)
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

### 5. Line Type Discrimination

Lines are typed to distinguish physical goods from services:
```typescript
enum LineType {
  Item = "ITEM",       // Physical goods (default)
  Service = "SERVICE", // Service-based work
  NRE = "NRE",        // Non-Recurring Engineering
}
```

Service lines bypass receiving workflow and use `ServiceLineStatus` for completion tracking.

### 6. Blanket PO Utilization

Blanket POs track authorization usage:
```typescript
interface BlanketUtilization {
  committed: number;   // Unreleased line amounts
  released: number;    // Sum of all releases
  consumed: number;    // Invoiced/paid
  available: number;   // Remaining authorization
  releaseCount: number;
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

### Core Workflow
- `src/app/supply/purchase-orders/_lib/contexts/revision-context.tsx` - Core workflow logic
- `src/app/supply/purchase-orders/_adapters/purchase-order.adapter.ts` - Data access

### Types & Enums
- `src/types/enums/line-type.ts` - LineType, ServiceBillingType enums
- `src/types/enums/service-line-status.ts` - ServiceLineStatus enum
- `src/types/enums/po-type.ts` - POType enum
- `src/app/supply/purchase-orders/_lib/types/purchase-order.types.ts` - Core PO types
- `src/app/supply/purchase-orders/_lib/types/blanket-po.types.ts` - Blanket PO types

### Service Line Components
- `src/components/service-progress-editor.tsx` - Progress tracking UI
- `src/components/milestone-editor.tsx` - Milestone management
- `src/components/add-line-modal.tsx` - Includes Service tab for adding service lines

### Blanket PO Components
- `src/components/blanket-utilization-card.tsx` - Utilization visualization
- `src/components/create-release-modal.tsx` - Release creation wizard
- `src/components/release-history-panel.tsx` - Release list with filtering

## Default Service Categories

The following categories are available for service lines:
- NRE (Non-Recurring Engineering)
- Consulting
- Maintenance
- Installation
- Training
- Testing
- Tooling
- Engineering
- Support

Categories are user-configurable via app settings.
