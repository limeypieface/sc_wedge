"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  Truck,
  FileText,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LineItem } from "@/lib/mock-data"
import { validateShipment } from "@/lib/validation"
import { useFieldErrors, FieldError } from "@/hooks/use-field-errors"

// Shipment line selection
interface ShipmentLineSelection {
  lineNumber: number
  sku: string
  name: string
  availableQty: number // quantityPacked - quantityShipped (or issued for simpler flow)
  selectedQty: number
  selected: boolean
}

// Carrier options
const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "freight", label: "Freight Carrier" },
  { value: "will_call", label: "Will Call / Pickup" },
]

// Service levels
const SERVICE_LEVELS: Record<string, { value: string; label: string }[]> = {
  fedex: [
    { value: "ground", label: "FedEx Ground" },
    { value: "express", label: "FedEx Express" },
    { value: "2day", label: "FedEx 2Day" },
    { value: "overnight", label: "FedEx Overnight" },
  ],
  ups: [
    { value: "ground", label: "UPS Ground" },
    { value: "3day", label: "UPS 3 Day Select" },
    { value: "2day", label: "UPS 2nd Day Air" },
    { value: "overnight", label: "UPS Next Day Air" },
  ],
  usps: [
    { value: "priority", label: "Priority Mail" },
    { value: "express", label: "Priority Express" },
    { value: "ground", label: "Ground Advantage" },
  ],
  dhl: [
    { value: "express", label: "DHL Express" },
    { value: "ecommerce", label: "DHL eCommerce" },
  ],
  freight: [
    { value: "ltl", label: "LTL Freight" },
    { value: "ftl", label: "Full Truckload" },
  ],
  will_call: [
    { value: "pickup", label: "Customer Pickup" },
  ],
}

// Step type
type ShipmentStep = "select_items" | "shipping_info" | "documents" | "confirm"

interface SOCreateShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (shipmentData: ShipmentData) => void
  lines: LineItem[]
  soNumber: string
  customerName: string
}

export interface ShipmentData {
  shipmentId: string
  lines: { lineNumber: number; sku: string; name: string; qty: number }[]
  carrier: string
  serviceLevel: string
  trackingNumber: string
  shipDate: string
  estimatedDelivery: string
  weight?: string
  packages?: number
  documents: {
    packingSlip: boolean
    billOfLading: boolean
    commercialInvoice: boolean
    certificateOfConformance: boolean
  }
  generateInvoice: boolean
}

export function SOCreateShipmentModal({
  isOpen,
  onClose,
  onComplete,
  lines,
  soNumber,
  customerName,
}: SOCreateShipmentModalProps) {
  const [step, setStep] = useState<ShipmentStep>("select_items")
  const [isProcessing, setIsProcessing] = useState(false)

  // Line selection state
  const [lineSelections, setLineSelections] = useState<ShipmentLineSelection[]>([])

  // Shipping info state
  const [carrier, setCarrier] = useState("")
  const [serviceLevel, setServiceLevel] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0])
  const [estimatedDelivery, setEstimatedDelivery] = useState("")
  const [weight, setWeight] = useState("")
  const [packages, setPackages] = useState("1")

  // Field validation state
  const fieldErrors = useFieldErrors()

  // Document generation state
  const [generatePackingSlip, setGeneratePackingSlip] = useState(true)
  const [generateBOL, setGenerateBOL] = useState(false)
  const [generateCommercialInvoice, setGenerateCommercialInvoice] = useState(false)
  const [generateCOC, setGenerateCOC] = useState(false)
  const [generateInvoice, setGenerateInvoice] = useState(true)

  // Initialize line selections when modal opens
  useMemo(() => {
    if (isOpen) {
      const selections = lines
        .filter(line => {
          // Lines that have been issued/packed but not fully shipped
          const issuedQty = line.quantityReleased || line.quantityPacked || line.quantityOrdered
          return issuedQty > line.quantityShipped
        })
        .map(line => {
          const issuedQty = line.quantityReleased || line.quantityPacked || line.quantityOrdered
          const availableQty = issuedQty - line.quantityShipped
          return {
            lineNumber: line.lineNumber,
            sku: line.sku,
            name: line.name,
            availableQty,
            selectedQty: availableQty, // Default to all available
            selected: true,
          }
        })
      setLineSelections(selections)

      // Reset other state
      setStep("select_items")
      setCarrier("")
      setServiceLevel("")
      setTrackingNumber("")
      setShipDate(new Date().toISOString().split("T")[0])
      setEstimatedDelivery("")
      setWeight("")
      setPackages("1")
      setGeneratePackingSlip(true)
      setGenerateBOL(false)
      setGenerateCommercialInvoice(false)
      setGenerateCOC(false)
      setGenerateInvoice(true)
      fieldErrors.clearAll()
    }
  }, [isOpen, lines])

  // Calculate totals
  const selectedLines = lineSelections.filter(l => l.selected && l.selectedQty > 0)
  const totalUnits = selectedLines.reduce((sum, l) => sum + l.selectedQty, 0)

  // Check if any selected lines need COC
  const needsCOC = useMemo(() => {
    return selectedLines.some(sel => {
      const line = lines.find(l => l.lineNumber === sel.lineNumber)
      return line?.qualityRequirements?.cocRequired
    })
  }, [selectedLines, lines])

  const handleToggleLine = (lineNumber: number) => {
    setLineSelections(prev =>
      prev.map(l =>
        l.lineNumber === lineNumber ? { ...l, selected: !l.selected } : l
      )
    )
  }

  const handleUpdateQty = (lineNumber: number, qty: number) => {
    setLineSelections(prev =>
      prev.map(l =>
        l.lineNumber === lineNumber
          ? { ...l, selectedQty: Math.min(Math.max(0, qty), l.availableQty) }
          : l
      )
    )
  }

  const handleNext = () => {
    switch (step) {
      case "select_items":
        // Validate that at least one line is selected
        if (selectedLines.length === 0) {
          fieldErrors.setFieldError("lines", "At least one item must be selected")
          return
        }
        fieldErrors.clearAll()
        setStep("shipping_info")
        break
      case "shipping_info":
        // Validate shipping info
        const result = validateShipment({
          carrier,
          trackingNumber,
          shipDate,
          expectedDelivery: estimatedDelivery,
          weight: weight || undefined,
          selectedLines: selectedLines.map(l => ({
            lineNumber: l.lineNumber,
            quantity: l.selectedQty,
            maxQuantity: l.availableQty,
          })),
        })

        fieldErrors.applyValidationResult(result)

        if (!result.isValid) return

        setStep("documents")
        // Auto-enable COC if needed
        if (needsCOC) setGenerateCOC(true)
        break
      case "documents":
        setStep("confirm")
        break
      case "confirm":
        handleComplete()
        break
    }
  }

  const handleBack = () => {
    switch (step) {
      case "shipping_info":
        setStep("select_items")
        break
      case "documents":
        setStep("shipping_info")
        break
      case "confirm":
        setStep("documents")
        break
    }
  }

  const handleComplete = async () => {
    setIsProcessing(true)

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    const shipmentData: ShipmentData = {
      shipmentId: `SHP-${soNumber.replace("SO-", "")}-${Date.now().toString().slice(-4)}`,
      lines: selectedLines.map(l => ({
        lineNumber: l.lineNumber,
        sku: l.sku,
        name: l.name,
        qty: l.selectedQty,
      })),
      carrier,
      serviceLevel,
      trackingNumber,
      shipDate,
      estimatedDelivery,
      weight,
      packages: parseInt(packages) || 1,
      documents: {
        packingSlip: generatePackingSlip,
        billOfLading: generateBOL,
        commercialInvoice: generateCommercialInvoice,
        certificateOfConformance: generateCOC,
      },
      generateInvoice,
    }

    setIsProcessing(false)
    onComplete(shipmentData)
  }

  const canProceed = useMemo(() => {
    switch (step) {
      case "select_items":
        return selectedLines.length > 0
      case "shipping_info":
        return carrier && (carrier === "will_call" || trackingNumber)
      case "documents":
        return true
      case "confirm":
        return true
      default:
        return false
    }
  }, [step, selectedLines.length, carrier, trackingNumber])

  const getStepTitle = () => {
    switch (step) {
      case "select_items":
        return "Select Items to Ship"
      case "shipping_info":
        return "Shipping Information"
      case "documents":
        return "Generate Documents"
      case "confirm":
        return "Confirm Shipment"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
          <DialogDescription>
            {soNumber} - {customerName}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-2 border-b">
          {[
            { id: "select_items", label: "Items", icon: Package },
            { id: "shipping_info", label: "Shipping", icon: Truck },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "confirm", label: "Confirm", icon: CheckCircle2 },
          ].map((s, i, arr) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : arr.findIndex(x => x.id === step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Select Items */}
          {step === "select_items" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select items and quantities to include in this shipment.
              </p>

              {lineSelections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No items ready for shipment</p>
                  <p className="text-xs">All items are either fully shipped or not yet issued</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lineSelections.map(line => (
                    <div
                      key={line.lineNumber}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        line.selected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <Checkbox
                        checked={line.selected}
                        onCheckedChange={() => handleToggleLine(line.lineNumber)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{line.lineNumber}
                          </span>
                          <span className="font-medium">{line.sku}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{line.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={line.selectedQty}
                          onChange={(e) => handleUpdateQty(line.lineNumber, parseInt(e.target.value) || 0)}
                          disabled={!line.selected}
                          className="w-20 h-8 text-right"
                          min={0}
                          max={line.availableQty}
                        />
                        <span className="text-xs text-muted-foreground w-16">
                          of {line.availableQty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedLines.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Total to Ship</span>
                  <span className="font-medium">
                    {selectedLines.length} line{selectedLines.length !== 1 ? "s" : ""}, {totalUnits} units
                  </span>
                </div>
              )}

              <FieldError error={fieldErrors.getError("lines")} />
            </div>
          )}

          {/* Step 2: Shipping Info */}
          {step === "shipping_info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Carrier</Label>
                  <Select
                    value={carrier}
                    onValueChange={(v) => {
                      setCarrier(v)
                      setServiceLevel("")
                      fieldErrors.clearFieldError("Carrier")
                    }}
                  >
                    <SelectTrigger className={cn(fieldErrors.hasError("Carrier") && "border-destructive")}>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIERS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError error={fieldErrors.getError("Carrier")} />
                </div>

                <div className="space-y-2">
                  <Label>Service Level</Label>
                  <Select value={serviceLevel} onValueChange={setServiceLevel} disabled={!carrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {(SERVICE_LEVELS[carrier] || []).map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {carrier !== "will_call" && (
                <div className="space-y-2">
                  <Label>Tracking Number</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value)
                      fieldErrors.clearFieldError("Tracking Number")
                    }}
                    placeholder="Enter tracking number"
                    aria-invalid={fieldErrors.hasError("Tracking Number")}
                    className={cn(fieldErrors.hasError("Tracking Number") && "border-destructive")}
                  />
                  <FieldError error={fieldErrors.getError("Tracking Number")} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ship Date</Label>
                  <Input
                    type="date"
                    value={shipDate}
                    onChange={(e) => {
                      setShipDate(e.target.value)
                      fieldErrors.clearFieldError("Ship Date")
                    }}
                    aria-invalid={fieldErrors.hasError("Ship Date")}
                    className={cn(fieldErrors.hasError("Ship Date") && "border-destructive")}
                  />
                  <FieldError error={fieldErrors.getError("Ship Date")} />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Delivery</Label>
                  <Input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value)
                      fieldErrors.clearFieldError("Weight")
                    }}
                    placeholder="Optional"
                    aria-invalid={fieldErrors.hasError("Weight")}
                    className={cn(fieldErrors.hasError("Weight") && "border-destructive")}
                  />
                  <FieldError error={fieldErrors.getError("Weight")} />
                </div>

                <div className="space-y-2">
                  <Label>Number of Packages</Label>
                  <Input
                    type="number"
                    value={packages}
                    onChange={(e) => setPackages(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === "documents" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select documents to generate with this shipment.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={generatePackingSlip}
                    onCheckedChange={(c) => setGeneratePackingSlip(!!c)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Packing Slip</div>
                    <p className="text-xs text-muted-foreground">
                      Itemized list of shipped items for customer
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={generateBOL}
                    onCheckedChange={(c) => setGenerateBOL(!!c)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Bill of Lading</div>
                    <p className="text-xs text-muted-foreground">
                      Legal document for freight shipments
                    </p>
                  </div>
                  {carrier === "freight" && (
                    <Badge variant="secondary" className="text-xs">Required for Freight</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={generateCommercialInvoice}
                    onCheckedChange={(c) => setGenerateCommercialInvoice(!!c)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Commercial Invoice</div>
                    <p className="text-xs text-muted-foreground">
                      Required for international shipments
                    </p>
                  </div>
                </div>

                {needsCOC && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-300 bg-amber-50">
                    <Checkbox
                      checked={generateCOC}
                      onCheckedChange={(c) => setGenerateCOC(!!c)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        Certificate of Conformance
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Required for items with quality requirements
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">Required</Badge>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                  <Checkbox
                    checked={generateInvoice}
                    onCheckedChange={(c) => setGenerateInvoice(!!c)}
                  />
                  <Receipt className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Generate Invoice</div>
                    <p className="text-xs text-muted-foreground">
                      Create invoice for shipped items
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Recommended</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Shipment Summary</h4>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Carrier: </span>
                    <span className="font-medium">{CARRIERS.find(c => c.value === carrier)?.label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Service: </span>
                    <span className="font-medium">
                      {SERVICE_LEVELS[carrier]?.find(s => s.value === serviceLevel)?.label || "—"}
                    </span>
                  </div>
                  {trackingNumber && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-medium font-mono">{trackingNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Ship Date: </span>
                    <span className="font-medium">{shipDate}</span>
                  </div>
                  {estimatedDelivery && (
                    <div>
                      <span className="text-muted-foreground">Est. Delivery: </span>
                      <span className="font-medium">{estimatedDelivery}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Items ({selectedLines.length})</h4>
                <div className="space-y-1.5">
                  {selectedLines.map(line => (
                    <div key={line.lineNumber} className="flex justify-between text-sm">
                      <span>
                        <span className="text-muted-foreground">#{line.lineNumber}</span>{" "}
                        {line.sku}
                      </span>
                      <span className="font-medium">{line.selectedQty} units</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Documents to Generate</h4>
                <div className="flex flex-wrap gap-2">
                  {generatePackingSlip && (
                    <Badge variant="secondary">Packing Slip</Badge>
                  )}
                  {generateBOL && (
                    <Badge variant="secondary">Bill of Lading</Badge>
                  )}
                  {generateCommercialInvoice && (
                    <Badge variant="secondary">Commercial Invoice</Badge>
                  )}
                  {generateCOC && (
                    <Badge variant="secondary">Certificate of Conformance</Badge>
                  )}
                  {generateInvoice && (
                    <Badge className="bg-green-100 text-green-700">Invoice</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          {step !== "select_items" && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : step === "confirm" ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Shipment
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
