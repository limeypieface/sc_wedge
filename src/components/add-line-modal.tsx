"use client"

import { useState, useMemo, useEffect } from "react"
import { TAX_RATES } from "@/lib/tax-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Search,
  Package,
  FileText,
  Check,
  ChevronRight,
  AlertTriangle,
  Briefcase,
  DollarSign,
  Clock,
  Flag,
  Calendar,
} from "lucide-react"
import {
  getCatalogItemsForVendor,
  getOpenRequisitionsForVendor,
  getRequisitionRemainingQty,
  getCatalogItemBySku,
  type CatalogItem,
  type OpenRequisitionLine,
  type LineItem,
} from "@/lib/mock-data"
import { validateLineItem, type ValidationResult } from "@/lib/validation"
import { useFieldErrors, FieldError, FieldWarning } from "@/hooks/use-field-errors"
import {
  LineType,
  ServiceBillingType,
  ServiceBillingTypeMeta,
  ServiceLineStatus,
  DEFAULT_SERVICE_CATEGORIES,
} from "@/types/enums"
import type { ServiceLineDetails, ServiceProgress, MilestoneItem } from "@/app/supply/purchase-orders/_lib/types/purchase-order.types"

interface AddLineModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (newLine: NewLineData) => void
  vendorId: string
  nextLineNumber: number
}

export interface NewLineData {
  // Core line data
  lineNumber: number
  sku: string
  name: string
  description: string
  quantity: number
  unitOfMeasure: string
  unitPrice: number
  // Calculated
  lineTotal: number
  // Sourcing
  projectCode: string
  commodityCode: string
  requisitionNumber?: string
  requisitionLineNumber?: number
  // Timing
  promisedDate: string
  leadTimeDays: number
  // Need linkage (from requisition)
  need?: {
    moNumber: string
    customer: string
    needDate: string
    qtyNeeded: number
  }
  // Tax and discount
  taxCode: "STANDARD" | "EXEMPT" | "REDUCED"
  taxRate: number
  discountPercent: number
  // Quality
  qualityRequirements: {
    inspectionRequired: boolean
    cocRequired: boolean
    faiRequired: boolean
    mtrRequired: boolean
    sourceInspection: boolean
  }
  // Revision
  itemRevision: string
  // Service line fields (optional)
  lineType?: LineType
  serviceDetails?: ServiceLineDetails
  serviceStatus?: ServiceLineStatus
}

type SourceMode = "catalog" | "requisition" | "service"

export function AddLineModal({ isOpen, onClose, onAdd, vendorId, nextLineNumber }: AddLineModalProps) {
  // Source mode
  const [sourceMode, setSourceMode] = useState<SourceMode>("catalog")
  const [searchQuery, setSearchQuery] = useState("")

  // Selection state
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null)
  const [selectedRequisition, setSelectedRequisition] = useState<OpenRequisitionLine | null>(null)

  // Form state (populated from selection, editable)
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [promisedDate, setPromisedDate] = useState("")
  const [discountPercent, setDiscountPercent] = useState("0")
  const [taxCode, setTaxCode] = useState<"STANDARD" | "EXEMPT" | "REDUCED">("STANDARD")
  const [projectCode, setProjectCode] = useState("")

  // Service line form state
  const [serviceName, setServiceName] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [serviceCategory, setServiceCategory] = useState<string>(DEFAULT_SERVICE_CATEGORIES[0])
  const [serviceBillingType, setServiceBillingType] = useState<ServiceBillingType>(ServiceBillingType.FixedPrice)
  const [serviceAmount, setServiceAmount] = useState("")
  const [serviceRate, setServiceRate] = useState("")
  const [serviceEstimatedUnits, setServiceEstimatedUnits] = useState("")
  const [serviceNTE, setServiceNTE] = useState("")
  const [serviceStartDate, setServiceStartDate] = useState("")
  const [serviceEndDate, setServiceEndDate] = useState("")
  const [serviceSowRef, setServiceSowRef] = useState("")

  // Field validation state
  const fieldErrors = useFieldErrors()

  // Get available items for this vendor
  const catalogItems = useMemo(() => getCatalogItemsForVendor(vendorId), [vendorId])
  const requisitionLines = useMemo(() => getOpenRequisitionsForVendor(vendorId), [vendorId])

  // Filter by search
  const filteredCatalogItems = useMemo(() => {
    if (!searchQuery) return catalogItems
    const query = searchQuery.toLowerCase()
    return catalogItems.filter(item =>
      item.sku.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }, [catalogItems, searchQuery])

  const filteredRequisitions = useMemo(() => {
    if (!searchQuery) return requisitionLines
    const query = searchQuery.toLowerCase()
    return requisitionLines.filter(line =>
      line.sku.toLowerCase().includes(query) ||
      line.name.toLowerCase().includes(query) ||
      line.requisitionNumber.toLowerCase().includes(query) ||
      line.projectName.toLowerCase().includes(query)
    )
  }, [requisitionLines, searchQuery])

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSourceMode("catalog")
      setSearchQuery("")
      setSelectedCatalogItem(null)
      setSelectedRequisition(null)
      setQuantity("")
      setUnitPrice("")
      setPromisedDate("")
      setDiscountPercent("0")
      setTaxCode("STANDARD")
      setProjectCode("")
      // Reset service state
      setServiceName("")
      setServiceDescription("")
      setServiceCategory(DEFAULT_SERVICE_CATEGORIES[0])
      setServiceBillingType(ServiceBillingType.FixedPrice)
      setServiceAmount("")
      setServiceRate("")
      setServiceEstimatedUnits("")
      setServiceNTE("")
      setServiceStartDate("")
      setServiceEndDate("")
      setServiceSowRef("")
      fieldErrors.clearAll()
    }
  }, [isOpen])

  // Auto-populate form when catalog item selected
  const handleSelectCatalogItem = (item: CatalogItem) => {
    setSelectedCatalogItem(item)
    setSelectedRequisition(null)
    setQuantity("1")
    setUnitPrice(item.defaultUnitPrice.toString())
    setTaxCode(item.taxCode)
    setDiscountPercent("0")
    setProjectCode("")
    // Calculate default promise date based on lead time
    const promiseDate = new Date()
    promiseDate.setDate(promiseDate.getDate() + item.leadTimeDays)
    setPromisedDate(promiseDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
  }

  // Auto-populate form when requisition selected
  const handleSelectRequisition = (req: OpenRequisitionLine) => {
    setSelectedRequisition(req)
    setSelectedCatalogItem(null)
    const remainingQty = getRequisitionRemainingQty(req)
    setQuantity(remainingQty.toString())
    setUnitPrice(req.estimatedUnitPrice.toString())
    setProjectCode(req.projectCode)
    // Get tax code from catalog if available
    const catalogItem = getCatalogItemBySku(req.sku)
    setTaxCode(catalogItem?.taxCode || "STANDARD")
    setDiscountPercent("0")
    // Use need date as promise date
    setPromisedDate(req.needDate)
  }

  // Get the selected item info
  const selectedItem = selectedCatalogItem || (selectedRequisition ? getCatalogItemBySku(selectedRequisition.sku) : null)

  // Calculate line total
  const calculations = useMemo(() => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    const discount = parseFloat(discountPercent) || 0
    const taxRate = TAX_RATES[taxCode]

    const subtotal = qty * price
    const discountAmount = subtotal * (discount / 100)
    const netAmount = subtotal - discountAmount
    const taxAmount = netAmount * taxRate
    const lineTotal = netAmount + taxAmount

    return { subtotal, discountAmount, netAmount, taxAmount, lineTotal }
  }, [quantity, unitPrice, discountPercent, taxCode])

  // Run validation
  const validationResult = useMemo(() => {
    if (!selectedItem) return null
    return validateLineItem({
      sku: selectedRequisition?.sku || selectedCatalogItem?.sku,
      quantity,
      unitPrice,
      discountPercent,
      taxRate: TAX_RATES[taxCode] * 100, // Convert to percentage
      unitOfMeasure: selectedItem.unitOfMeasure,
      catalogPrice: selectedCatalogItem?.defaultUnitPrice,
    })
  }, [selectedItem, selectedRequisition, selectedCatalogItem, quantity, unitPrice, discountPercent, taxCode])

  // Can add service line check
  const canAddService = useMemo(() => {
    if (sourceMode !== "service") return false
    if (!serviceName.trim()) return false

    if (serviceBillingType === ServiceBillingType.FixedPrice || serviceBillingType === ServiceBillingType.Milestone) {
      return parseFloat(serviceAmount) > 0
    }
    if (serviceBillingType === ServiceBillingType.TimeAndMaterials) {
      return parseFloat(serviceRate) > 0 && parseFloat(serviceEstimatedUnits) > 0
    }
    return false
  }, [sourceMode, serviceName, serviceBillingType, serviceAmount, serviceRate, serviceEstimatedUnits])

  // Can add if there's a selection and validation passes (or service is valid)
  const canAdd = sourceMode === "service" ? canAddService : (selectedItem && validationResult?.isValid)

  const handleAdd = () => {
    // Handle service line
    if (sourceMode === "service") {
      // Validate service fields
      const errors: string[] = []
      if (!serviceName.trim()) {
        fieldErrors.setFieldError("Service Name", "Service name is required")
        errors.push("Service Name")
      }

      if (serviceBillingType === ServiceBillingType.FixedPrice || serviceBillingType === ServiceBillingType.Milestone) {
        if (!serviceAmount || parseFloat(serviceAmount) <= 0) {
          fieldErrors.setFieldError("Amount", "Amount must be greater than 0")
          errors.push("Amount")
        }
      }

      if (serviceBillingType === ServiceBillingType.TimeAndMaterials) {
        if (!serviceRate || parseFloat(serviceRate) <= 0) {
          fieldErrors.setFieldError("Rate", "Rate must be greater than 0")
          errors.push("Rate")
        }
        if (!serviceEstimatedUnits || parseFloat(serviceEstimatedUnits) <= 0) {
          fieldErrors.setFieldError("Estimated Hours", "Estimated hours must be greater than 0")
          errors.push("Estimated Hours")
        }
      }

      if (errors.length > 0) return

      // Calculate line total
      let lineTotal = 0
      let qty = 1
      let unitPriceVal = 0

      if (serviceBillingType === ServiceBillingType.TimeAndMaterials) {
        qty = parseFloat(serviceEstimatedUnits)
        unitPriceVal = parseFloat(serviceRate)
        lineTotal = qty * unitPriceVal
      } else {
        lineTotal = parseFloat(serviceAmount)
        unitPriceVal = lineTotal
      }

      // Create service line
      const serviceDetails: ServiceLineDetails = {
        billingType: serviceBillingType,
        category: serviceCategory,
        progress: {
          percentComplete: 0,
          estimatedUnits: serviceBillingType === ServiceBillingType.TimeAndMaterials
            ? parseFloat(serviceEstimatedUnits)
            : 0,
          consumedUnits: 0,
          unitType: "hours",
        },
        ...(serviceBillingType === ServiceBillingType.TimeAndMaterials && {
          rate: parseFloat(serviceRate),
          rateUnit: "hour" as const,
          nteAmount: serviceNTE ? parseFloat(serviceNTE) : undefined,
        }),
        ...(serviceSowRef && { sowReference: serviceSowRef }),
        ...(serviceStartDate && { serviceStartDate }),
        ...(serviceEndDate && { serviceEndDate }),
      }

      const newLine: NewLineData = {
        lineNumber: nextLineNumber,
        sku: `SVC-${serviceCategory.toUpperCase().replace(/\s+/g, "-")}-${Date.now().toString(36).toUpperCase()}`,
        name: serviceName,
        description: serviceDescription,
        quantity: qty,
        unitOfMeasure: serviceBillingType === ServiceBillingType.TimeAndMaterials ? "HR" : "LOT",
        unitPrice: unitPriceVal,
        lineTotal,
        projectCode,
        commodityCode: "SVC",
        promisedDate: serviceEndDate || "",
        leadTimeDays: 0,
        taxCode: "EXEMPT",
        taxRate: 0,
        discountPercent: 0,
        qualityRequirements: {
          inspectionRequired: false,
          cocRequired: false,
          faiRequired: false,
          mtrRequired: false,
          sourceInspection: false,
        },
        itemRevision: "1.0",
        // Service-specific fields
        lineType: serviceCategory === "NRE" ? LineType.NRE : LineType.Service,
        serviceDetails,
        serviceStatus: ServiceLineStatus.NotStarted,
      }

      onAdd(newLine)
      onClose()
      return
    }

    // Handle catalog/requisition line (existing logic)
    if (!selectedItem) return

    // Run validation and apply errors
    const result = validateLineItem({
      sku: selectedRequisition?.sku || selectedCatalogItem?.sku,
      quantity,
      unitPrice,
      discountPercent,
      taxRate: TAX_RATES[taxCode] * 100,
      unitOfMeasure: selectedItem.unitOfMeasure,
      catalogPrice: selectedCatalogItem?.defaultUnitPrice,
    })

    fieldErrors.applyValidationResult(result)

    if (!result.isValid) return

    const newLine: NewLineData = {
      lineNumber: nextLineNumber,
      sku: selectedRequisition?.sku || selectedCatalogItem?.sku || "",
      name: selectedRequisition?.name || selectedCatalogItem?.name || "",
      description: selectedRequisition?.description || selectedCatalogItem?.description || "",
      quantity: parseFloat(quantity),
      unitOfMeasure: selectedItem.unitOfMeasure,
      unitPrice: parseFloat(unitPrice),
      lineTotal: calculations.netAmount,
      projectCode: projectCode || selectedRequisition?.projectCode || "",
      commodityCode: selectedItem.commodityCode,
      requisitionNumber: selectedRequisition?.requisitionNumber,
      requisitionLineNumber: selectedRequisition?.requisitionLineNumber,
      promisedDate,
      leadTimeDays: selectedItem.leadTimeDays,
      need: selectedRequisition ? {
        moNumber: selectedRequisition.moNumber,
        customer: selectedRequisition.customerName,
        needDate: selectedRequisition.needDate,
        qtyNeeded: parseFloat(quantity),
      } : undefined,
      taxCode,
      taxRate: TAX_RATES[taxCode],
      discountPercent: parseFloat(discountPercent),
      qualityRequirements: selectedItem.qualityRequirements,
      itemRevision: selectedItem.revision,
      lineType: LineType.Item,
    }

    onAdd(newLine)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
          <DialogDescription>
            Select an item from the catalog or fulfill an open requisition
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Source Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setSourceMode("catalog")
                setSelectedRequisition(null)
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                sourceMode === "catalog"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <Package className="w-4 h-4" />
              From Catalog
              <span className="text-xs bg-muted px-1.5 rounded">{catalogItems.length}</span>
            </button>
            <button
              onClick={() => {
                setSourceMode("requisition")
                setSelectedCatalogItem(null)
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                sourceMode === "requisition"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <FileText className="w-4 h-4" />
              From Requisition
              <span className="text-xs bg-muted px-1.5 rounded">{requisitionLines.length}</span>
            </button>
            <button
              onClick={() => {
                setSourceMode("service")
                setSelectedCatalogItem(null)
                setSelectedRequisition(null)
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors",
                sourceMode === "service"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Service
            </button>
          </div>

          {/* Search - hide for service mode */}
          {sourceMode !== "service" && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={sourceMode === "catalog" ? "Search items by SKU, name..." : "Search requisitions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          {/* Service Form - show when service mode */}
          {sourceMode === "service" && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Line header */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">New Service Line</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded">Line {nextLineNumber}</span>
                </div>
              </div>

              {/* Service Name & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Service Name *</Label>
                  <Input
                    value={serviceName}
                    onChange={(e) => {
                      setServiceName(e.target.value)
                      fieldErrors.clearFieldError("Service Name")
                    }}
                    placeholder="e.g., PCB Design Services"
                    aria-invalid={fieldErrors.hasError("Service Name")}
                    className={cn("h-9", fieldErrors.hasError("Service Name") && "border-destructive")}
                  />
                  <FieldError error={fieldErrors.getError("Service Name")} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Category *</Label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {DEFAULT_SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe the service work..."
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Billing Type */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Billing Type</Label>
                <div className="flex gap-2">
                  {[
                    { type: ServiceBillingType.FixedPrice, icon: DollarSign, label: "Fixed Price" },
                    { type: ServiceBillingType.TimeAndMaterials, icon: Clock, label: "T&M" },
                    { type: ServiceBillingType.Milestone, icon: Flag, label: "Milestone" },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setServiceBillingType(type)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                        serviceBillingType === type
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing-specific fields */}
              {serviceBillingType === ServiceBillingType.FixedPrice && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Total Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceAmount}
                      onChange={(e) => {
                        setServiceAmount(e.target.value)
                        fieldErrors.clearFieldError("Amount")
                      }}
                      aria-invalid={fieldErrors.hasError("Amount")}
                      className={cn("h-9 pl-6", fieldErrors.hasError("Amount") && "border-destructive")}
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError error={fieldErrors.getError("Amount")} />
                </div>
              )}

              {serviceBillingType === ServiceBillingType.TimeAndMaterials && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Hourly Rate *</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={serviceRate}
                        onChange={(e) => {
                          setServiceRate(e.target.value)
                          fieldErrors.clearFieldError("Rate")
                        }}
                        aria-invalid={fieldErrors.hasError("Rate")}
                        className={cn("h-9 pl-6", fieldErrors.hasError("Rate") && "border-destructive")}
                        placeholder="0.00"
                      />
                    </div>
                    <FieldError error={fieldErrors.getError("Rate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Est. Hours *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={serviceEstimatedUnits}
                      onChange={(e) => {
                        setServiceEstimatedUnits(e.target.value)
                        fieldErrors.clearFieldError("Estimated Hours")
                      }}
                      aria-invalid={fieldErrors.hasError("Estimated Hours")}
                      className={cn("h-9", fieldErrors.hasError("Estimated Hours") && "border-destructive")}
                      placeholder="40"
                    />
                    <FieldError error={fieldErrors.getError("Estimated Hours")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">NTE Amount</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={serviceNTE}
                        onChange={(e) => setServiceNTE(e.target.value)}
                        className="h-9 pl-6"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {serviceBillingType === ServiceBillingType.Milestone && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Total Amount * (milestones configured later)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceAmount}
                      onChange={(e) => {
                        setServiceAmount(e.target.value)
                        fieldErrors.clearFieldError("Amount")
                      }}
                      aria-invalid={fieldErrors.hasError("Amount")}
                      className={cn("h-9 pl-6", fieldErrors.hasError("Amount") && "border-destructive")}
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError error={fieldErrors.getError("Amount")} />
                  <p className="text-xs text-muted-foreground">
                    You can configure individual milestones after adding the line.
                  </p>
                </div>
              )}

              {/* Service Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Start Date
                  </Label>
                  <Input
                    type="date"
                    value={serviceStartDate}
                    onChange={(e) => setServiceStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> End Date
                  </Label>
                  <Input
                    type="date"
                    value={serviceEndDate}
                    onChange={(e) => setServiceEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* SOW Reference & Project Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">SOW Reference</Label>
                  <Input
                    value={serviceSowRef}
                    onChange={(e) => setServiceSowRef(e.target.value)}
                    placeholder="SOW-2026-0001"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Project Code</Label>
                  <Input
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="Optional"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Calculated Total for T&M */}
              {serviceBillingType === ServiceBillingType.TimeAndMaterials && serviceRate && serviceEstimatedUnits && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Estimated Total: {serviceEstimatedUnits} hrs × ${parseFloat(serviceRate || "0").toFixed(2)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Line Total</p>
                    <p className="text-lg font-semibold tabular-nums">
                      ${(parseFloat(serviceRate || "0") * parseFloat(serviceEstimatedUnits || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Fixed Price / Milestone Total */}
              {(serviceBillingType === ServiceBillingType.FixedPrice || serviceBillingType === ServiceBillingType.Milestone) && serviceAmount && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {serviceBillingType === ServiceBillingType.Milestone ? "Total across milestones" : "Fixed price"}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Line Total</p>
                    <p className="text-lg font-semibold tabular-nums">
                      ${parseFloat(serviceAmount || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Item List - only for catalog/requisition modes */}
          {sourceMode !== "service" && (
            <div className="flex-1 overflow-y-auto border rounded-lg divide-y max-h-[200px]">
            {sourceMode === "catalog" ? (
              filteredCatalogItems.length > 0 ? (
                filteredCatalogItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCatalogItem(item)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                      selectedCatalogItem?.id === item.id && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{item.sku}</span>
                        <span className="text-xs text-muted-foreground">{item.revision}</span>
                      </div>
                      <p className="text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">${(item.defaultUnitPrice ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{item.leadTimeDays ?? 0}d lead</p>
                    </div>
                    {selectedCatalogItem?.id === item.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No items available from this vendor
                </div>
              )
            ) : (
              filteredRequisitions.length > 0 ? (
                filteredRequisitions.map(req => {
                  const remainingQty = getRequisitionRemainingQty(req)
                  return (
                    <button
                      key={req.id}
                      onClick={() => handleSelectRequisition(req)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                        selectedRequisition?.id === req.id && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{req.requisitionNumber}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium text-primary">{req.sku}</span>
                        </div>
                        <p className="text-sm truncate">{req.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-1.5 py-0.5 bg-muted rounded">{req.projectCode}</span>
                          <span>Need: {req.needDate}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{remainingQty} {req.unitOfMeasure}</p>
                        <p className="text-xs text-muted-foreground">${(req.estimatedUnitPrice ?? 0).toFixed(2)} ea</p>
                      </div>
                      {selectedRequisition?.id === req.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No open requisitions for this vendor
                </div>
              )
            )}
          </div>
          )}

          {/* Form - shows when item selected (for catalog/requisition modes) */}
          {selectedItem && (
            <>
              <Separator className="my-4" />

              <div className="space-y-4">
                {/* Selected item summary */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-primary">{selectedRequisition?.sku || selectedCatalogItem?.sku}</span>
                      <span className="text-muted-foreground mx-2">—</span>
                      <span>{selectedRequisition?.name || selectedCatalogItem?.name}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">Line {nextLineNumber}</span>
                  </div>
                  {selectedRequisition && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Fulfilling {selectedRequisition.requisitionNumber} · {selectedRequisition.projectName} · {selectedRequisition.customerName}
                    </div>
                  )}
                </div>

                {/* Quantity & Price */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quantity ({selectedItem.unitOfMeasure})</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value)
                        fieldErrors.clearFieldError("Quantity")
                      }}
                      aria-invalid={fieldErrors.hasError("Quantity")}
                      className={cn("h-9", fieldErrors.hasError("Quantity") && "border-destructive")}
                    />
                    <FieldError error={fieldErrors.getError("Quantity")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => {
                          setUnitPrice(e.target.value)
                          fieldErrors.clearFieldError("Unit Price")
                          fieldErrors.clearFieldWarning("unitPrice")
                        }}
                        aria-invalid={fieldErrors.hasError("Unit Price")}
                        className={cn("h-9 pl-6", fieldErrors.hasError("Unit Price") && "border-destructive")}
                      />
                    </div>
                    <FieldError error={fieldErrors.getError("Unit Price")} />
                    <FieldWarning warning={fieldErrors.getWarning("unitPrice")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Promise Date</Label>
                    <Input
                      type="text"
                      value={promisedDate}
                      onChange={(e) => setPromisedDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Project & Discount */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Project Code</Label>
                    <Input
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value)}
                      placeholder="Optional"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => {
                        setDiscountPercent(e.target.value)
                        fieldErrors.clearFieldError("Discount")
                        fieldErrors.clearFieldWarning("discount")
                      }}
                      aria-invalid={fieldErrors.hasError("Discount")}
                      className={cn("h-9", fieldErrors.hasError("Discount") && "border-destructive")}
                    />
                    <FieldError error={fieldErrors.getError("Discount")} />
                    <FieldWarning warning={fieldErrors.getWarning("discount")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tax Code</Label>
                    <div className="flex gap-1">
                      {(["STANDARD", "REDUCED", "EXEMPT"] as const).map(code => (
                        <button
                          key={code}
                          onClick={() => setTaxCode(code)}
                          className={cn(
                            "flex-1 py-1.5 text-xs rounded border transition-colors",
                            taxCode === code
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {code === "STANDARD" ? "Std" : code === "REDUCED" ? "Red" : "Exm"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Line Total */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subtotal: </span>
                    <span className="tabular-nums">${calculations.subtotal.toFixed(2)}</span>
                    {calculations.discountAmount > 0 && (
                      <>
                        <span className="text-muted-foreground mx-2">−</span>
                        <span className="text-emerald-600 tabular-nums">${calculations.discountAmount.toFixed(2)}</span>
                      </>
                    )}
                    {calculations.taxAmount > 0 && (
                      <>
                        <span className="text-muted-foreground mx-2">+</span>
                        <span className="text-muted-foreground tabular-nums">${calculations.taxAmount.toFixed(2)} tax</span>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Line Total</p>
                    <p className="text-lg font-semibold tabular-nums">${calculations.lineTotal.toFixed(2)}</p>
                  </div>
                </div>

                {/* Quality Requirements Info */}
                {selectedItem.qualityRequirements && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Quality: </span>
                    {[
                      selectedItem.qualityRequirements.inspectionRequired && "Inspection",
                      selectedItem.qualityRequirements.cocRequired && "COC",
                      selectedItem.qualityRequirements.faiRequired && "FAI",
                      selectedItem.qualityRequirements.mtrRequired && "MTR",
                      selectedItem.qualityRequirements.sourceInspection && "Source Insp.",
                    ].filter(Boolean).join(", ") || "None"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canAdd}>
            Add Line {nextLineNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
