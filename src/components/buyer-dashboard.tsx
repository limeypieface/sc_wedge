"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  AlertCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Zap,
  FileText,
  DollarSign,
  Package,
  Search,
  X,
  Filter,
  ShieldCheck,
  FileWarning,
  ClipboardList,
  Building2,
  User,
  Calendar,
} from "lucide-react"
import { openRequisitionLines, type OpenRequisitionLine } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { IssueRef } from "@/components/issue-ref"
import { IssueCard, IssueSection, type IssueCardData } from "@/components/issue-card"
import { POViewSelector, type POViewMode } from "@/components/po-view-selector"
import { POHeadersTable, type ExtendedPO } from "@/components/po-headers-table"
import { POLinesTable, type POLineItem } from "@/components/po-lines-table"
import { LineDisplaySelector, type LineViewMode } from "@/components/line-display-selector"

// =============================================================================
// MOCK DATA - Multiple POs for a buyer view
// =============================================================================

const mockPurchaseOrders: ExtendedPO[] = [
  {
    id: "PO-0861",
    vendor: "FlightTech Controllers Inc.",
    vendorCode: "FTC",
    status: "partially_received",
    urgency: "high",
    // Financial
    total: 5475.61,
    invoiced: 3250.00,
    paid: 1500.00,
    openBalance: 3975.61,
    paymentTerms: "Net 30",
    paymentDueDate: "Feb 15, 2026",
    // Lines
    linesCount: 4,
    openLines: 2,
    linesReceived: 2,
    // Issues
    issuesCount: 3,
    criticalIssues: 1,
    qualityHolds: 2,
    // Dates
    created: "Jan 3, 2026",
    expected: "Feb 10, 2026",
    lastReceipt: "Jan 18, 2026",
    // Delivery
    shipMethod: "Ground",
    destination: "Main Warehouse",
    shipmentsInTransit: 1,
    shipmentsComplete: 2,
    carrier: "FedEx",
    // Fulfillment
    qtyOrdered: 22,
    qtyReceived: 13,
    valueReceived: 3250.00,
    daysOpen: 6,
    // Risk
    lateRisk: "medium",
    vendorOnTime: 92,
    daysToDue: 32,
  },
  {
    id: "PO-0858",
    vendor: "Precision Motors LLC",
    vendorCode: "PML",
    status: "open",
    urgency: "critical",
    total: 12340.00,
    invoiced: 0,
    paid: 0,
    openBalance: 12340.00,
    paymentTerms: "Net 45",
    paymentDueDate: "Mar 15, 2026",
    linesCount: 6,
    openLines: 6,
    linesReceived: 0,
    issuesCount: 1,
    criticalIssues: 1,
    qualityHolds: 0,
    created: "Jan 5, 2026",
    expected: "Jan 30, 2026",
    lastReceipt: undefined,
    shipMethod: "Air",
    destination: "Production Facility",
    shipmentsInTransit: 1,
    shipmentsComplete: 0,
    carrier: "DHL",
    qtyOrdered: 48,
    qtyReceived: 0,
    valueReceived: 0,
    daysOpen: 4,
    lateRisk: "high",
    vendorOnTime: 78,
    daysToDue: 21,
  },
  {
    id: "PO-0855",
    vendor: "Advanced Circuits Corp",
    vendorCode: "ACC",
    status: "received",
    urgency: "standard",
    total: 8920.50,
    invoiced: 8920.50,
    paid: 8920.50,
    openBalance: 0,
    paymentTerms: "Net 30",
    paymentDueDate: "Feb 20, 2026",
    linesCount: 3,
    openLines: 0,
    linesReceived: 3,
    issuesCount: 0,
    criticalIssues: 0,
    qualityHolds: 0,
    created: "Dec 28, 2025",
    expected: "Jan 20, 2026",
    lastReceipt: "Jan 19, 2026",
    shipMethod: "Ground",
    destination: "Main Warehouse",
    shipmentsInTransit: 0,
    shipmentsComplete: 2,
    carrier: "UPS",
    qtyOrdered: 15,
    qtyReceived: 15,
    valueReceived: 8920.50,
    daysOpen: 12,
    lateRisk: "none",
    vendorOnTime: 94,
    daysToDue: 0,
  },
  {
    id: "PO-0852",
    vendor: "Global Components Inc",
    vendorCode: "GCI",
    status: "partially_received",
    urgency: "standard",
    total: 3450.25,
    invoiced: 1800.00,
    paid: 1800.00,
    openBalance: 1650.25,
    paymentTerms: "Net 30",
    paymentDueDate: "Feb 25, 2026",
    linesCount: 5,
    openLines: 2,
    linesReceived: 3,
    issuesCount: 2,
    criticalIssues: 0,
    qualityHolds: 1,
    created: "Dec 22, 2025",
    expected: "Jan 25, 2026",
    lastReceipt: "Jan 15, 2026",
    shipMethod: "Ground",
    destination: "Main Warehouse",
    shipmentsInTransit: 1,
    shipmentsComplete: 1,
    carrier: "FedEx",
    qtyOrdered: 40,
    qtyReceived: 24,
    valueReceived: 1800.00,
    daysOpen: 18,
    lateRisk: "low",
    vendorOnTime: 85,
    daysToDue: 16,
  },
  {
    id: "PO-0849",
    vendor: "TechSupply Partners",
    vendorCode: "TSP",
    status: "partially_received",
    urgency: "high",
    total: 6780.00,
    invoiced: 0,
    paid: 0,
    openBalance: 6780.00,
    paymentTerms: "Net 30",
    paymentDueDate: "Mar 5, 2026",
    linesCount: 4,
    openLines: 2,
    linesReceived: 2,
    issuesCount: 2,
    criticalIssues: 0,
    qualityHolds: 0,
    created: "Jan 8, 2026",
    expected: "Feb 5, 2026",
    lastReceipt: "Jan 8, 2026",
    shipMethod: "Expedited",
    destination: "Production Facility",
    shipmentsInTransit: 1,
    shipmentsComplete: 1,
    carrier: "FedEx",
    qtyOrdered: 32,
    qtyReceived: 8,
    valueReceived: 1695.00,
    daysOpen: 1,
    lateRisk: "medium",
    vendorOnTime: 96,
    daysToDue: 27,
  },
]

// Enhanced line items with more data for different views
const mockLineItems: POLineItem[] = [
  {
    id: 1,
    poNumber: "PO-0861",
    lineNumber: 1,
    sku: "CTL004",
    name: "RC Receiver 2.4GHz Encrypted",
    vendor: "FlightTech Controllers Inc.",
    vendorCode: "FTC",
    projectCode: "PROJ-FALCON",
    status: "partial",
    quantityOrdered: 12,
    quantityShipped: 8,
    quantityReceived: 6,
    quantityAccepted: 6,
    quantityInQualityHold: 0,
    quantityPaid: 4,
    unitPrice: 107.82,
    lineTotal: 1293.84,
    promisedDate: "Jan 21, 2026",
    needDate: "Jan 25, 2026",
    inspectionRequired: true,
    cocRequired: false,
    ncrCount: 0,
    expedite: false,
    shipments: [
      { id: "SHP-001", status: "in_transit", expectedDate: "Jan 28, 2026" },
      { id: "SHP-003", status: "in_transit", expectedDate: "Jan 28, 2026" },
    ],
  },
  {
    id: 2,
    poNumber: "PO-0861",
    lineNumber: 2,
    sku: "PSW-102",
    name: "Power Supply Unit 500W",
    vendor: "FlightTech Controllers Inc.",
    vendorCode: "FTC",
    projectCode: "PROJ-RACK",
    status: "partial",
    quantityOrdered: 6,
    quantityShipped: 4,
    quantityReceived: 4,
    quantityAccepted: 3,
    quantityInQualityHold: 1,
    quantityPaid: 3,
    unitPrice: 245.50,
    lineTotal: 1473.00,
    promisedDate: "Jan 28, 2026",
    needDate: "Jan 30, 2026",
    inspectionRequired: true,
    cocRequired: true,
    ncrCount: 1,
    expedite: true,
    shipments: [
      { id: "SHP-002", status: "in_transit", expectedDate: "Jan 28, 2026" },
      { id: "SHP-003", status: "in_transit", expectedDate: "Jan 28, 2026" },
    ],
  },
  {
    id: 3,
    poNumber: "PO-0861",
    lineNumber: 3,
    sku: "CAB-050",
    name: "Network Cable Cat6 500ft",
    vendor: "FlightTech Controllers Inc.",
    vendorCode: "FTC",
    projectCode: "PROJ-INFRA",
    status: "partial",
    quantityOrdered: 2,
    quantityShipped: 2,
    quantityReceived: 2,
    quantityAccepted: 2,
    quantityInQualityHold: 0,
    quantityPaid: 2,
    unitPrice: 150.00,
    lineTotal: 300.00,
    promisedDate: "Feb 5, 2026",
    needDate: "Feb 10, 2026",
    inspectionRequired: false,
    cocRequired: false,
    ncrCount: 0,
    expedite: false,
    shipments: [
      { id: "SHP-001", status: "received", receivedDate: "Jan 17, 2026" },
    ],
  },
  {
    id: 4,
    poNumber: "PO-0861",
    lineNumber: 4,
    sku: "MON-275",
    name: "Monitor 27in 4K LED",
    vendor: "FlightTech Controllers Inc.",
    vendorCode: "FTC",
    projectCode: "PROJ-WS",
    status: "open",
    quantityOrdered: 4,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityInQualityHold: 0,
    quantityPaid: 0,
    unitPrice: 580.00,
    lineTotal: 2320.00,
    promisedDate: "Feb 10, 2026",
    needDate: "Feb 5, 2026",
    inspectionRequired: false,
    cocRequired: false,
    ncrCount: 0,
    expedite: false,
    shipments: [
      { id: "SHP-004", status: "expected", expectedDate: "Feb 10, 2026" },
    ],
  },
  {
    id: 5,
    poNumber: "PO-0858",
    lineNumber: 1,
    sku: "MTR-200",
    name: "Brushless DC Motor 48V 500W",
    vendor: "Precision Motors LLC",
    vendorCode: "PML",
    projectCode: "PROJ-DRIVE",
    status: "open",
    quantityOrdered: 25,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityInQualityHold: 0,
    quantityPaid: 0,
    unitPrice: 285.00,
    lineTotal: 7125.00,
    promisedDate: "Jan 5, 2026",
    needDate: "Jan 10, 2026",
    inspectionRequired: true,
    cocRequired: true,
    ncrCount: 0,
    expedite: true,
    shipments: [],
  },
  {
    id: 6,
    poNumber: "PO-0855",
    lineNumber: 1,
    sku: "PCB-100",
    name: "PCB Main Controller Board",
    vendor: "Advanced Circuits Corp",
    vendorCode: "ACC",
    projectCode: "PROJ-CTRL",
    status: "received",
    quantityOrdered: 20,
    quantityShipped: 20,
    quantityReceived: 20,
    quantityAccepted: 20,
    quantityInQualityHold: 0,
    quantityPaid: 20,
    unitPrice: 285.00,
    lineTotal: 5700.00,
    promisedDate: "Jan 18, 2026",
    needDate: "Jan 20, 2026",
    inspectionRequired: true,
    cocRequired: true,
    ncrCount: 0,
    expedite: false,
    shipments: [
      { id: "SHP-002", status: "received", receivedDate: "Jan 18, 2026" },
    ],
  },
  {
    id: 7,
    poNumber: "PO-0852",
    lineNumber: 3,
    sku: "CAP-220",
    name: "Capacitor 220uF",
    vendor: "Global Components Inc",
    vendorCode: "GCI",
    projectCode: "PROJ-PWR",
    status: "partial",
    quantityOrdered: 100,
    quantityShipped: 60,
    quantityReceived: 50,
    quantityAccepted: 45,
    quantityInQualityHold: 5,
    quantityPaid: 45,
    unitPrice: 12.50,
    lineTotal: 1250.00,
    promisedDate: "Jan 22, 2026",
    needDate: "Jan 24, 2026",
    inspectionRequired: true,
    cocRequired: false,
    ncrCount: 0,
    expedite: false,
    shipments: [
      { id: "SHP-005", status: "received", receivedDate: "Jan 20, 2026" },
    ],
  },
  {
    id: 8,
    poNumber: "PO-0849",
    lineNumber: 1,
    sku: "SEN-400",
    name: "Proximity Sensor 40mm",
    vendor: "TechSupply Partners",
    vendorCode: "TSP",
    projectCode: "PROJ-AUTO",
    status: "open",
    quantityOrdered: 24,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityInQualityHold: 0,
    quantityPaid: 0,
    unitPrice: 145.00,
    lineTotal: 3480.00,
    promisedDate: "Feb 3, 2026",
    needDate: "Feb 5, 2026",
    inspectionRequired: false,
    cocRequired: false,
    ncrCount: 0,
    expedite: false,
    shipments: [],
  },
]

const mockIssues = [
  // Critical: NCR
  {
    id: "ISS-PO-0861-001",
    issueNumber: "ISS-PO-0861-001",
    category: "ncr" as const,
    priority: "critical" as const,
    title: "NCR NCR-2026-0142: Inspection Failure",
    description: "1 unit failed inspection. Unit failed continuity test during incoming QC.",
    poNumber: "PO-0861",
    sku: "PSW-102",
    shipmentId: "SHP-002",
    quantity: 1,
    date: "Jan 28, 2026",
  },
  // High: Invoice Disputed
  {
    id: "ISS-PO-0861-002",
    issueNumber: "ISS-PO-0861-002",
    category: "invoice" as const,
    priority: "high" as const,
    title: "Invoice INV-2026-0094 disputed",
    description: "Price variance detected. Invoice shows $245.50/unit vs PO price $242.00/unit.",
    poNumber: "PO-0861",
    shipmentId: "SHP-002",
    date: "Feb 21, 2026",
  },
  // High: Late Shipment
  {
    id: "ISS-PO-0858-001",
    issueNumber: "ISS-PO-0858-001",
    category: "delivery" as const,
    priority: "high" as const,
    title: "Late delivery: Brushless DC Motor 48V 500W",
    description: "MOT-500 expected Jan 25, vendor confirmed delay. New ETA pending.",
    poNumber: "PO-0858",
    sku: "MOT-500",
    date: "Overdue",
  },
  // High: Quality Hold
  {
    id: "ISS-PO-0852-001",
    issueNumber: "ISS-PO-0852-001",
    category: "quality_hold" as const,
    priority: "high" as const,
    title: "Quality hold: CAP-220 pending inspection",
    description: "5 units received, awaiting QC inspection before release to inventory.",
    poNumber: "PO-0852",
    sku: "CAP-220",
    quantity: 5,
    date: "Jan 26, 2026",
  },
  // Medium: Late Delivery
  {
    id: "ISS-PO-0858-002",
    issueNumber: "ISS-PO-0858-002",
    category: "delivery" as const,
    priority: "medium" as const,
    title: "Late delivery: Motor Mounting Bracket Kit",
    description: "BRK-200 expected Jan 26, shipment delayed due to manufacturing backlog.",
    poNumber: "PO-0858",
    sku: "BRK-200",
    date: "Overdue",
  },
  // Medium: Shipment Tracking
  {
    id: "ISS-PO-0861-003",
    issueNumber: "ISS-PO-0861-003",
    category: "shipment" as const,
    priority: "medium" as const,
    title: "SHP-003 in transit",
    description: "Shipment departed origin. Tracking shows on-time delivery expected.",
    poNumber: "PO-0861",
    shipmentId: "SHP-003",
    date: "Jan 28, 2026",
  },
  // Medium: Awaiting Shipment
  {
    id: "ISS-PO-0861-004",
    issueNumber: "ISS-PO-0861-004",
    category: "shipment" as const,
    priority: "medium" as const,
    title: "SHP-004 awaiting shipment",
    description: "Shipment ready for carrier pickup. Scheduled for tomorrow morning.",
    poNumber: "PO-0861",
    shipmentId: "SHP-004",
    date: "Feb 10, 2026",
  },
  // Low: Documentation Pending
  {
    id: "ISS-PO-0855-001",
    issueNumber: "ISS-PO-0855-001",
    category: "shipment" as const,
    priority: "low" as const,
    title: "COC pending: RES-100 batch",
    description: "Certificate of Conformance requested from vendor. Parts cleared for use.",
    poNumber: "PO-0855",
    sku: "RES-100",
    date: "Feb 5, 2026",
  },
  // Low: Minor Variance
  {
    id: "ISS-PO-0849-001",
    issueNumber: "ISS-PO-0849-001",
    category: "invoice" as const,
    priority: "low" as const,
    title: "Minor invoice variance: $12.50",
    description: "Freight charge variance. Within auto-approve threshold.",
    poNumber: "PO-0849",
    date: "Feb 8, 2026",
  },
]

const mockVendors = [
  {
    id: "FTC",
    name: "FlightTech Controllers Inc.",
    code: "FTC",
    openPOs: 1,
    openValue: 5475.61,
    openIssues: 3,
    onTime: 92,
    quality: 98,
    contact: "Daniel Thomas",
    email: "daniel.thomas@flightechcontrollers.com",
    phone: "+1-278-437-1129",
  },
  {
    id: "PML",
    name: "Precision Motors LLC",
    code: "PML",
    openPOs: 1,
    openValue: 12340.00,
    openIssues: 1,
    onTime: 78,
    quality: 95,
    contact: "Maria Garcia",
    email: "m.garcia@precisionmotors.com",
    phone: "+1-512-555-0147",
  },
  {
    id: "GCI",
    name: "Global Components Inc",
    code: "GCI",
    openPOs: 1,
    openValue: 3450.25,
    openIssues: 2,
    onTime: 85,
    quality: 91,
    contact: "James Chen",
    email: "jchen@globalcomponents.com",
    phone: "+1-408-555-0192",
  },
  {
    id: "TSP",
    name: "TechSupply Partners",
    code: "TSP",
    openPOs: 1,
    openValue: 6780.00,
    openIssues: 0,
    onTime: 96,
    quality: 99,
    contact: "Lisa Wong",
    email: "l.wong@techsupply.com",
    phone: "+1-650-555-0183",
  },
  {
    id: "ACC",
    name: "Advanced Circuits Corp",
    code: "ACC",
    openPOs: 0,
    openValue: 0,
    openIssues: 0,
    onTime: 94,
    quality: 97,
    contact: "Robert Kim",
    email: "r.kim@advancedcircuits.com",
    phone: "+1-503-555-0166",
  },
]

// =============================================================================
// LINE VIEW OPTIONS
// =============================================================================

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "partial", label: "Partial" },
  { value: "received", label: "Received" },
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "open":
      return { label: "Open", className: "bg-primary/10 text-primary" }
    case "partially_received":
    case "partial":
      return { label: "Partial", className: "bg-amber-100 text-amber-800" }
    case "received":
      return { label: "Received", className: "bg-primary/10 text-primary" }
    case "closed":
      return { label: "Closed", className: "bg-muted text-muted-foreground" }
    default:
      return { label: status, className: "bg-muted text-muted-foreground" }
  }
}

const getUrgencyDisplay = (urgency: string) => {
  switch (urgency) {
    case "critical":
      return { label: "Critical", className: "bg-destructive/10 text-destructive" }
    case "high":
      return { label: "High", className: "bg-amber-100 text-amber-800" }
    default:
      return null
  }
}

const getPriorityDisplay = (priority: string) => {
  switch (priority) {
    case "critical":
      return { label: "Critical", className: "bg-destructive/10 text-destructive" }
    case "high":
      return { label: "High", className: "bg-amber-100 text-amber-800" }
    case "medium":
      return { label: "Medium", className: "bg-muted text-muted-foreground" }
    default:
      return { label: priority, className: "bg-muted text-muted-foreground" }
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ncr":
      return <AlertTriangle className="w-4 h-4" />
    case "invoice":
      return <DollarSign className="w-4 h-4" />
    case "shipment":
      return <Truck className="w-4 h-4" />
    case "quality_hold":
      return <Package className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

const getShipmentStatusDisplay = (status?: string) => {
  switch (status) {
    case "delivered":
      return { label: "Delivered", className: "bg-primary/10 text-primary", icon: CheckCircle2 }
    case "in_transit":
      return { label: "In Transit", className: "bg-blue-50 text-blue-600", icon: Truck }
    case "expected":
      return { label: "Expected", className: "bg-muted text-muted-foreground", icon: Package }
    default:
      return null
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState("pos")
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [issueFilter, setIssueFilter] = useState<"action" | "all">("action")
  const [poViewMode, setPOViewMode] = useState<POViewMode>("overview")
  const [poSearch, setPOSearch] = useState("")

  // Lines tab state
  const [lineViewMode, setLineViewMode] = useState<LineViewMode>("basic")
  const [lineSearch, setLineSearch] = useState("")
  const [showIssuesOnlyLines, setShowIssuesOnlyLines] = useState(false)
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [showIssuesOnly, setShowIssuesOnly] = useState(false)

  // Requisitions tab state
  const [reqSearch, setReqSearch] = useState("")
  const [reqStatusFilter, setReqStatusFilter] = useState<string[]>([])
  const [reqProjectFilter, setReqProjectFilter] = useState<string[]>([])

  // Get unique vendors from line items
  const uniqueVendors = useMemo(() => {
    const vendors = new Map<string, string>()
    mockLineItems.forEach(line => {
      if (line.vendorCode && line.vendor) {
        vendors.set(line.vendorCode, line.vendor)
      }
    })
    return Array.from(vendors.entries()).map(([code, name]) => ({ code, name }))
  }, [])

  // Check if line has issues (quality holds or NCRs)
  const lineHasIssues = (line: POLineItem) => {
    return line.quantityInQualityHold > 0 || (line.ncrCount ?? 0) > 0
  }

  // Filtered lines
  const filteredLines = useMemo(() => {
    return mockLineItems.filter(line => {
      // Search filter
      if (lineSearch) {
        const search = lineSearch.toLowerCase()
        if (
          !line.sku.toLowerCase().includes(search) &&
          !line.name.toLowerCase().includes(search) &&
          !(line.poNumber?.toLowerCase().includes(search)) &&
          !(line.vendor?.toLowerCase().includes(search))
        ) {
          return false
        }
      }
      // Vendor filter
      if (selectedVendors.length > 0 && line.vendorCode && !selectedVendors.includes(line.vendorCode)) {
        return false
      }
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(line.status)) {
        return false
      }
      // Issues only filter
      if (showIssuesOnly && !lineHasIssues(line)) {
        return false
      }
      return true
    })
  }, [lineSearch, selectedVendors, selectedStatuses, showIssuesOnly])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedVendors.length > 0) count++
    if (selectedStatuses.length > 0) count++
    if (showIssuesOnly) count++
    return count
  }, [selectedVendors, selectedStatuses, showIssuesOnly])

  // Clear all filters
  const clearFilters = () => {
    setSelectedVendors([])
    setSelectedStatuses([])
    setShowIssuesOnly(false)
    setLineSearch("")
  }

  // Filtered POs based on search
  const filteredPOs = useMemo(() => {
    if (!poSearch) return mockPurchaseOrders
    const query = poSearch.toLowerCase()
    return mockPurchaseOrders.filter(po =>
      po.id.toLowerCase().includes(query) ||
      po.vendor.toLowerCase().includes(query) ||
      po.vendorCode.toLowerCase().includes(query)
    )
  }, [poSearch])

  // Computed metrics
  const metrics = useMemo(() => {
    const openPOs = mockPurchaseOrders.filter(po => po.status === "open" || po.status === "partially_received")
    const totalValue = openPOs.reduce((sum, po) => sum + po.total, 0)
    const criticalIssues = mockIssues.filter(i => i.priority === "critical" || i.priority === "high").length
    const linesWithIssues = mockLineItems.filter(l => lineHasIssues(l)).length

    return {
      openPOs: openPOs.length,
      totalValue,
      totalIssues: mockIssues.length,
      criticalIssues,
      linesWithIssues,
      totalLineItems: mockLineItems.length,
    }
  }, [])

  const filteredIssues = useMemo(() => {
    if (issueFilter === "action") {
      return mockIssues.filter(i => i.priority === "critical" || i.priority === "high")
    }
    return mockIssues
  }, [issueFilter])

  // Requisitions needing action (open or partial status)
  const reqsNeedingAction = useMemo(() => {
    return openRequisitionLines.filter(r => r.status === "open" || r.status === "partial").length
  }, [])

  // Unique projects for requisitions filter
  const uniqueProjects = useMemo(() => {
    const projects = new Map<string, string>()
    openRequisitionLines.forEach(req => projects.set(req.projectCode, req.projectName))
    return Array.from(projects.entries()).map(([code, name]) => ({ code, name }))
  }, [])

  // Filtered requisitions
  const filteredRequisitions = useMemo(() => {
    return openRequisitionLines.filter(req => {
      // Search filter
      if (reqSearch) {
        const search = reqSearch.toLowerCase()
        if (
          !req.requisitionNumber.toLowerCase().includes(search) &&
          !req.sku.toLowerCase().includes(search) &&
          !req.name.toLowerCase().includes(search) &&
          !req.projectName.toLowerCase().includes(search) &&
          !(req.preferredVendorName?.toLowerCase().includes(search))
        ) {
          return false
        }
      }
      // Status filter
      if (reqStatusFilter.length > 0 && !reqStatusFilter.includes(req.status)) {
        return false
      }
      // Project filter
      if (reqProjectFilter.length > 0 && !reqProjectFilter.includes(req.projectCode)) {
        return false
      }
      return true
    })
  }, [reqSearch, reqStatusFilter, reqProjectFilter])

  // Requisitions active filters count
  const reqActiveFiltersCount = useMemo(() => {
    let count = 0
    if (reqStatusFilter.length > 0) count++
    if (reqProjectFilter.length > 0) count++
    return count
  }, [reqStatusFilter, reqProjectFilter])

  // Clear requisitions filters
  const clearReqFilters = () => {
    setReqStatusFilter([])
    setReqProjectFilter([])
    setReqSearch("")
  }

  const tabs = [
    { id: "pos", label: "Purchase Orders", count: mockPurchaseOrders.length },
    { id: "lines", label: "Line Items", count: mockLineItems.length },
    { id: "requisitions", label: "Requisitions", count: reqsNeedingAction, highlight: reqsNeedingAction > 0 },
    { id: "issues", label: "Issues", count: metrics.criticalIssues, highlight: metrics.criticalIssues > 0 },
    { id: "vendors", label: "Vendors", count: mockVendors.length },
  ]

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Supply</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">Buyer Workbench</span>
            </div>
            <div className="text-xs bg-primary text-white px-3 py-1 rounded font-medium">JS</div>
          </div>

          {/* Title and summary */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Buyer Workbench</h1>
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Open POs</div>
                  <div className="text-foreground font-semibold text-lg">{metrics.openPOs}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Open Value</div>
                  <div className="text-foreground font-semibold text-lg">
                    ${metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Action Required</div>
                  <div className={cn("font-semibold text-lg", metrics.criticalIssues > 0 ? "text-destructive" : "text-foreground")}>
                    {metrics.criticalIssues} issues
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Lines with Issues</div>
                  <div className={cn("font-semibold text-lg", metrics.linesWithIssues > 0 ? "text-amber-600" : "text-foreground")}>
                    {metrics.linesWithIssues}
                  </div>
                </div>
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground">New PO</Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background">
        <div className="px-6 flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 px-1 text-sm font-medium relative transition-colors whitespace-nowrap flex items-center gap-2",
                activeTab === tab.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full",
                  tab.highlight ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* POs Tab */}
          {activeTab === "pos" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Purchase Orders</h2>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search POs..."
                      value={poSearch}
                      onChange={(e) => setPOSearch(e.target.value)}
                      className="pl-9 w-64 h-9"
                    />
                    {poSearch && (
                      <button
                        onClick={() => setPOSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* View Selector */}
                  <POViewSelector value={poViewMode} onChange={setPOViewMode} />
                </div>
              </div>

              {/* PO Table */}
              <POHeadersTable
                purchaseOrders={filteredPOs}
                viewMode={poViewMode}
                onPOClick={(po) => {
                  // Navigate to PO detail - for now just log
                  console.log("Navigate to PO:", po.id)
                }}
              />

              {/* Footer */}
              <div className="text-xs text-muted-foreground">
                Showing {filteredPOs.length} purchase order{filteredPOs.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* Lines Tab - Enhanced */}
          {activeTab === "lines" && (
            <div className="space-y-4">
              {/* Header with View Selector */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Order Lines</h2>
                <LineDisplaySelector value={lineViewMode} onChange={(v) => setLineViewMode(v as LineViewMode)} />
              </div>

              {/* Search and Filters Row */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PO, SKU, item, vendor..."
                    className="pl-9 h-9"
                    value={lineSearch}
                    onChange={(e) => setLineSearch(e.target.value)}
                  />
                  {lineSearch && (
                    <button
                      onClick={() => setLineSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Vendor Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      Vendor
                      {selectedVendors.length > 0 && (
                        <Badge className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {selectedVendors.length}
                        </Badge>
                      )}
                      <ChevronDown className="ml-1 w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter by Vendor</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {uniqueVendors.map((vendor) => (
                      <DropdownMenuCheckboxItem
                        key={vendor.code}
                        checked={selectedVendors.includes(vendor.code)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVendors([...selectedVendors, vendor.code])
                          } else {
                            setSelectedVendors(selectedVendors.filter((v) => v !== vendor.code))
                          }
                        }}
                      >
                        <span className="flex-1 truncate">{vendor.name}</span>
                        <span className="text-xs text-muted-foreground font-mono ml-2">{vendor.code}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      Status
                      {selectedStatuses.length > 0 && (
                        <Badge className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {selectedStatuses.length}
                        </Badge>
                      )}
                      <ChevronDown className="ml-1 w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STATUS_OPTIONS.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status.value}
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, status.value])
                          } else {
                            setSelectedStatuses(selectedStatuses.filter((s) => s !== status.value))
                          }
                        }}
                      >
                        {status.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Issues Toggle */}
                <Button
                  variant={showIssuesOnly ? "default" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={() => setShowIssuesOnly(!showIssuesOnly)}
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                  Issues Only
                </Button>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    Clear ({activeFiltersCount})
                  </Button>
                )}
              </div>

              {/* Active Filters Summary */}
              {(selectedVendors.length > 0 || selectedStatuses.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Filters:</span>
                  {selectedVendors.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="text-xs gap-1 cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedVendors(selectedVendors.filter((v) => v !== code))}
                    >
                      {code}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                  {selectedStatuses.map((status) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="text-xs gap-1 cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedStatuses(selectedStatuses.filter((s) => s !== status))}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === status)?.label}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Line Items Table */}
              {filteredLines.length > 0 ? (
                <POLinesTable
                  lines={filteredLines}
                  viewMode={lineViewMode}
                  showPOColumn={true}
                  onLineClick={(line) => {
                    console.log("Navigate to line:", line.poNumber, line.lineNumber)
                  }}
                />
              ) : (
                <Card className="border border-border overflow-hidden">
                  <div className="px-6 py-12 text-center">
                    <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <div className="font-medium text-foreground">No lines match your filters</div>
                    <div className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </Card>
              )}

              {/* Results Summary */}
              {filteredLines.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Showing {filteredLines.length} of {mockLineItems.length} lines
                </div>
              )}
            </div>
          )}

          {/* Requisitions Tab */}
          {activeTab === "requisitions" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Open Requisition Lines</h2>
                  <p className="text-sm text-muted-foreground">{reqsNeedingAction} lines need PO assignment</p>
                </div>
                <Button className="bg-primary text-primary-foreground">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Create PO from Selection
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requisition, SKU, item, project..."
                    className="pl-9 h-9"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                  />
                  {reqSearch && (
                    <button
                      onClick={() => setReqSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      Status
                      {reqStatusFilter.length > 0 && (
                        <Badge className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {reqStatusFilter.length}
                        </Badge>
                      )}
                      <ChevronDown className="ml-1 w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={reqStatusFilter.includes("open")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setReqStatusFilter([...reqStatusFilter, "open"])
                        } else {
                          setReqStatusFilter(reqStatusFilter.filter(s => s !== "open"))
                        }
                      }}
                    >
                      Open
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={reqStatusFilter.includes("partial")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setReqStatusFilter([...reqStatusFilter, "partial"])
                        } else {
                          setReqStatusFilter(reqStatusFilter.filter(s => s !== "partial"))
                        }
                      }}
                    >
                      Partial
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={reqStatusFilter.includes("assigned")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setReqStatusFilter([...reqStatusFilter, "assigned"])
                        } else {
                          setReqStatusFilter(reqStatusFilter.filter(s => s !== "assigned"))
                        }
                      }}
                    >
                      Assigned
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Project Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      Project
                      {reqProjectFilter.length > 0 && (
                        <Badge className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {reqProjectFilter.length}
                        </Badge>
                      )}
                      <ChevronDown className="ml-1 w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {uniqueProjects.map((project) => (
                      <DropdownMenuCheckboxItem
                        key={project.code}
                        checked={reqProjectFilter.includes(project.code)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReqProjectFilter([...reqProjectFilter, project.code])
                          } else {
                            setReqProjectFilter(reqProjectFilter.filter(p => p !== project.code))
                          }
                        }}
                      >
                        <span className="truncate">{project.name}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {reqActiveFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearReqFilters}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    Clear ({reqActiveFiltersCount})
                  </Button>
                )}
              </div>

              {/* Requisitions Table */}
              {filteredRequisitions.length > 0 ? (
                <Card className="border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Requisition</th>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                        <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty</th>
                        <th className="text-right py-2 px-4 font-medium text-muted-foreground">Est. Value</th>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Need Date</th>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Preferred Vendor</th>
                        <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequisitions.map((req) => {
                        const remainingQty = req.quantity - req.quantityAssigned
                        const estValue = remainingQty * req.estimatedUnitPrice
                        const needDate = new Date(req.needDate.replace(/(\w+) (\d+), (\d+)/, "$1 $2, $3"))
                        const today = new Date("2026-01-27")
                        const daysUntilNeed = Math.ceil((needDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        const isUrgent = daysUntilNeed <= 14 && req.status !== "assigned"

                        return (
                          <tr key={req.id} className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-primary font-medium">{req.requisitionNumber}</span>
                                <span className="text-muted-foreground text-xs">Ln {req.requisitionLineNumber}</span>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" />
                                {req.requestedBy}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-foreground">{req.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{req.sku}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {req.status === "partial" ? (
                                <div>
                                  <span className="font-medium text-amber-600">{remainingQty}</span>
                                  <span className="text-muted-foreground text-xs">/{req.quantity}</span>
                                </div>
                              ) : (
                                <span className="font-medium">{req.quantity}</span>
                              )}
                              <div className="text-xs text-muted-foreground">{req.unitOfMeasure}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-medium tabular-nums">
                                ${estValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                @${req.estimatedUnitPrice.toFixed(2)}/{req.unitOfMeasure}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={cn(
                                "flex items-center gap-1.5",
                                isUrgent && "text-destructive font-medium"
                              )}>
                                <Calendar className="w-3.5 h-3.5" />
                                {req.needDate}
                              </div>
                              {isUrgent && (
                                <div className="text-xs text-destructive mt-0.5">
                                  {daysUntilNeed <= 0 ? "Overdue" : `${daysUntilNeed} days`}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-foreground">{req.projectName}</div>
                              <div className="text-xs text-muted-foreground">{req.customerName}</div>
                            </td>
                            <td className="py-3 px-4">
                              {req.preferredVendorName ? (
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-foreground">{req.preferredVendorName}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No preference</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={cn(
                                "text-xs",
                                req.status === "open" ? "bg-amber-100 text-amber-800" :
                                req.status === "partial" ? "bg-blue-100 text-blue-800" :
                                "bg-primary/10 text-primary"
                              )}>
                                {req.status === "open" ? "Open" : req.status === "partial" ? "Partial" : "Assigned"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                                  Add to PO
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                    Showing {filteredRequisitions.length} of {openRequisitionLines.length} requisition lines
                  </div>
                </Card>
              ) : (
                <Card className="border border-border overflow-hidden">
                  <div className="px-6 py-12 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <div className="font-medium text-foreground">No requisition lines match your filters</div>
                    <div className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearReqFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === "issues" && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl font-bold tabular-nums">{mockIssues.length}</span>
                <span className="text-muted-foreground">open</span>
                {metrics.criticalIssues > 0 && (
                  <>
                    <span className="text-destructive font-medium tabular-nums ml-2">{metrics.criticalIssues}</span>
                    <span className="text-destructive">action required</span>
                  </>
                )}
              </div>

              {/* Action Required Section */}
              {mockIssues.filter(i => i.priority === "critical" || i.priority === "high").length > 0 && (
                <IssueSection
                  title="Action Required"
                  issues={mockIssues
                    .filter(i => i.priority === "critical" || i.priority === "high")
                    .map(issue => ({
                      id: issue.id,
                      issueNumber: issue.issueNumber,
                      category: issue.category,
                      priority: issue.priority,
                      title: issue.title,
                      description: issue.description,
                      date: issue.date,
                      poNumber: issue.poNumber,
                      sku: issue.sku,
                      shipmentId: issue.shipmentId,
                      quantity: issue.quantity,
                      amount: issue.amount,
                      onEmailClick: () => console.log("Email for", issue.id),
                      onCreateRMA: issue.category === "ncr" ? () => console.log("Create RMA for", issue.id) : undefined,
                      onTrackClick: issue.shipmentId ? () => console.log("Track", issue.shipmentId) : undefined,
                    }))}
                  showOrderRef={true}
                />
              )}

              {/* Tracking Section */}
              {mockIssues.filter(i => i.priority === "medium" || i.priority === "low").length > 0 && (
                <IssueSection
                  title="Tracking"
                  issues={mockIssues
                    .filter(i => i.priority === "medium" || i.priority === "low")
                    .map(issue => ({
                      id: issue.id,
                      issueNumber: issue.issueNumber,
                      category: issue.category,
                      priority: issue.priority,
                      title: issue.title,
                      description: issue.description,
                      date: issue.date,
                      poNumber: issue.poNumber,
                      sku: issue.sku,
                      shipmentId: issue.shipmentId,
                      quantity: issue.quantity,
                      amount: issue.amount,
                      onEmailClick: () => console.log("Email for", issue.id),
                      onTrackClick: issue.shipmentId ? () => console.log("Track", issue.shipmentId) : undefined,
                    }))}
                  showOrderRef={true}
                />
              )}

              {/* Empty State */}
              {mockIssues.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <div className="font-medium text-foreground">No issues requiring action</div>
                  <div className="text-sm text-muted-foreground">All purchase orders are on track</div>
                </div>
              )}
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === "vendors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Vendors</h2>
              </div>
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Vendor</th>
                      <th className="text-center py-2.5 px-4 font-medium text-muted-foreground">Open POs</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Open Value</th>
                      <th className="text-center py-2.5 px-4 font-medium text-muted-foreground">Issues</th>
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">On-Time</th>
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Quality</th>
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Contact</th>
                      <th className="w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockVendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{vendor.code}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-medium tabular-nums">{vendor.openPOs}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium tabular-nums">
                            ${vendor.openValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {vendor.openIssues > 0 ? (
                            <span className="inline-flex items-center gap-1 text-destructive font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {vendor.openIssues}
                            </span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  vendor.onTime >= 90 ? "bg-primary" : vendor.onTime >= 80 ? "bg-amber-500" : "bg-destructive"
                                )}
                                style={{ width: `${vendor.onTime}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums w-8">{vendor.onTime}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  vendor.quality >= 95 ? "bg-primary" : vendor.quality >= 85 ? "bg-amber-500" : "bg-destructive"
                                )}
                                style={{ width: `${vendor.quality}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums w-8">{vendor.quality}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-foreground">{vendor.contact}</div>
                          <div className="text-xs text-muted-foreground">{vendor.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
