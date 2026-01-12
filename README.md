# Sindri Prototype

A manufacturing-oriented supply chain management prototype with Purchase Order and Sales Order workflows, built with domain-driven architecture.

## Overview

This prototype demonstrates a complete supply chain management system with:

- **Purchase Orders (PO)** - Inbound supply chain with revision-based approval workflows
- **Sales Orders (SO)** - Outbound sales with direct-edit model and fulfillment tracking
- **Domain Engines** - Pure, testable business logic separated from UI
- **Universal Status System** - Consistent visual indicators across all order types
- **Configuration Wizard** - Onboarding flow that adapts to organization complexity

## Features

### Purchase Order Management

| Feature | Description |
|---------|-------------|
| **Revision Workflow** | Draft → Pending Approval → Approved → Sent → Acknowledged |
| **Multi-level Approval** | Threshold-based approval chains with escalation |
| **Blanket POs** | Ongoing releases against authorized totals |
| **Service Lines** | NRE, consulting, time & materials with milestone tracking |
| **Vendor Communication** | Email/VoIP integration with acknowledgment tracking |
| **PDF Generation** | Export POs for supplier contracts |

### Sales Order Management

| Feature | Description |
|---------|-------------|
| **Direct Edit Model** | No draft cycle - changes apply immediately |
| **Fulfillment Tracking** | Shipment creation and delivery status |
| **Customer Management** | Contact info, payment terms, shipping addresses |
| **Financial Tracking** | Order totals, invoicing status, payment tracking |

### Line Item Types

```
┌─────────────┬────────────────────────────────────────────┐
│ Line Type   │ Description                                │
├─────────────┼────────────────────────────────────────────┤
│ Material    │ Physical goods with receiving workflow     │
│ Service     │ Billable work (consulting, maintenance)    │
│ NRE         │ Non-Recurring Engineering charges          │
└─────────────┴────────────────────────────────────────────┘
```

Service lines support multiple billing types:
- **Fixed Price** - Single total amount
- **Time & Materials** - Hourly/daily rate with NTE limits
- **Milestone** - Payment tied to deliverable completion

### Blanket Purchase Orders

Blanket POs allow ongoing releases against an authorized total:

- Effective/expiration date tracking
- Per-release limits and authorization totals
- Utilization metrics (committed, released, consumed, available)
- Full release history with audit trail

## Architecture

### Domain Engines

Pure, framework-agnostic business logic with no side effects:

```
src/engines/
├── _kernel/           # Shared primitives (Money, Quantity, Result)
├── state-machine/     # FSM with guards and lifecycle hooks
├── financial/         # Pricing, discounts, taxes, totals
├── approval/          # Multi-stage approval workflows
├── revision/          # Semantic versioning & change tracking
├── communication/     # Multi-channel messaging
├── task/              # Signal detection & prioritization
└── authorization/     # Request-authorize-execute lifecycle
```

### Application Structure

```
src/
├── app/                              # Next.js routes
│   ├── supply/
│   │   ├── purchase-orders/          # PO list and management
│   │   └── suppliers/                # Supplier directory
│   ├── sales/
│   │   ├── sales-orders/             # SO list and management
│   │   └── customers/                # Customer directory
│   ├── po/[poNumber]/                # PO detail view
│   ├── so/[soNumber]/                # SO detail view
│   ├── buyer/                        # Buyer dashboard
│   ├── settings/                     # App configuration
│   └── setup/                        # Onboarding wizard
│
├── components/                       # React components
│   ├── ui/                          # Base UI library (shadcn/radix)
│   ├── po/                          # PO-specific components
│   ├── so/                          # SO-specific components
│   └── ...                          # Shared components
│
├── lib/
│   ├── ui/                          # UI utilities
│   │   ├── status-icons.tsx         # Universal status icons
│   │   ├── formatters.ts            # Display formatting
│   │   └── changes.ts               # Change tracking
│   ├── mock-data.ts                 # Development data
│   └── utils/                       # General utilities
│
└── types/
    ├── enums/                       # Status enums with metadata
    └── *.types.ts                   # Domain type definitions
```

### Universal Status Icons

Consistent visual indicators across PO, SO, and line items:

| Stage | Icon | Usage |
|-------|------|-------|
| `draft` | Dashed circle | Not yet active |
| `planned` | Dot-dashed circle | Scheduled |
| `open` | Empty circle | Awaiting action |
| `started` | 10% filled | Just begun |
| `partial` | 50% filled | In progress |
| `mostlyComplete` | 75% filled | Nearing completion |
| `nearComplete` | 90% filled | Almost done |
| `complete` | 100% filled (green) | Finished |
| `onHold` | Pause icon | Paused |
| `cancelled` | X icon | Terminated |
| `backordered` | Clock icon | Awaiting supply |

Usage:
```typescript
import { getStatusIcon, createStatusStageMapping } from '@/lib/ui/status-icons';

// Get icon directly
const icon = getStatusIcon("partial");

// Create domain mapping
const mapping = createStatusStageMapping({
  [MyStatus.Draft]: "draft",
  [MyStatus.Active]: "started",
  [MyStatus.Done]: "complete",
});
```

## Key Design Decisions

### 1. Feature Module Pattern

Each feature is self-contained:
```
purchase-orders/
├── _components/     # Feature UI components
├── _hooks/          # Feature hooks
├── _lib/            # Business logic & types
└── _adapters/       # Data access layer
```

### 2. Data Adapter Pattern

All data access through adapters (mock GraphQL in prototype):
```typescript
// Same interface in prototype and production
const { data, loading, error } = usePurchaseOrderQuery(poNumber);
```

### 3. State Management

| State Type | Location | Example |
|------------|----------|---------|
| Server State | Adapters | PO data, line items |
| Feature State | Contexts | Revision workflow |
| UI State | Components | Modal visibility |
| Global State | Global Contexts | Current user |

### 4. Approval Workflow

Threshold-based approval triggers:
```typescript
ApprovalConfig = {
  percentageThreshold: 0.05,  // 5% cost change
  absoluteThreshold: 500,     // $500 cost change
  mode: 'OR'                  // Either triggers approval
}
```

### 5. Financial Precision

BigInt-based money handling for precision:
```typescript
// From engines/_kernel/types.ts
type Money = {
  amount: bigint;      // In smallest currency unit
  currency: Currency;
  precision: number;
};
```

## Configuration & Onboarding

The setup wizard adapts to organization needs:

1. **Discovery Phase** - Organization type, manufacturing style, compliance needs
2. **Review Phase** - AI-suggested configuration based on discovery
3. **Configure Phase** - Fine-tune approval, receiving, quality settings
4. **Complete Phase** - Activate configuration

Complexity tiers: `Starter` → `Standard` → `Advanced` → `Enterprise`

## Running the Prototype

```bash
cd sindri-prototype
npm install
npm run dev
```

Open http://localhost:3000

## Testing

```bash
npm test           # Run all tests
npm run coverage   # With coverage report
```

Test structure:
- `src/engines/__tests__/` - Domain engine unit tests
- `src/__tests__/unit/` - Component and hook tests

## Tech Stack

- **Next.js 16** + **React 19** - Framework
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible component primitives
- **Zod** - Runtime validation
- **Vitest** - Testing

## Key Files

### Domain Engines
- `src/engines/_kernel/types.ts` - Core domain primitives
- `src/engines/financial/calculator.ts` - Pricing calculations
- `src/engines/approval/engine.ts` - Approval workflow logic
- `src/engines/state-machine/machine.ts` - FSM implementation

### Status System
- `src/lib/ui/status-icons.tsx` - Universal status icons
- `src/components/ui/status-pill.tsx` - Status badge component
- `src/types/enums/` - Status enum definitions

### Order Management
- `src/app/supply/purchase-orders/` - PO feature module
- `src/app/sales/sales-orders/` - SO feature module
- `src/components/po/po-status-config.ts` - PO status configuration
- `src/components/so/so-status-config.ts` - SO status configuration

## Migration to Production

When integrating into production Sindri:

1. **Replace adapters** - Swap mock adapters for real GraphQL
2. **Connect auth** - Use production AuthContext
3. **Add mutations** - Convert local state to GraphQL mutations
4. **Update imports** - Point to shared component library

## License

Proprietary - Internal use only
