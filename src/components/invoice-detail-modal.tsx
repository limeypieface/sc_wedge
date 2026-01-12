"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, X, ChevronRight, Clock, DollarSign, FileText, Calendar, Mail, MessageSquare } from "lucide-react"
import {
  type Invoice,
  type LineItem,
  type Shipment,
  type POCharge,
  type POHeader,
  lineItems as defaultLineItems,
  shipments as defaultShipments,
  poCharges as defaultCharges,
  poHeader as defaultHeader,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface InvoiceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  lines?: LineItem[]
  shipments?: Shipment[]
  charges?: POCharge[]
  header?: POHeader
  poNumber?: string
  variant?: "payables" | "receivables"
}

type TabId = "overview" | "analysis"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)

interface Issue {
  line?: number
  message: string
  severity: "error" | "warning"
  action?: string
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  lines = defaultLineItems,
  shipments = defaultShipments,
  charges = defaultCharges,
  header = defaultHeader,
  variant = "payables",
}: InvoiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const shipment = shipments.find(s => s.id === invoice.shipmentId)
  const isReceivables = variant === "receivables"

  // Variant-specific labels
  const labels = {
    orderType: isReceivables ? "SO" : "PO",
    orderRef: isReceivables ? "Sales Order" : "Purchase Order",
    receipt: isReceivables ? "Shipment" : "Receipt",
    received: isReceivables ? "Shipped" : "Received",
    readyMessage: isReceivables ? "Ready to collect" : "Ready for payment",
    readyDescription: isReceivables
      ? "All quantities and prices match SO and shipment"
      : "All quantities and prices match PO and receipt",
    counterparty: isReceivables ? "Customer" : "Vendor",
    messageTeam: isReceivables ? "Message AR" : "Message AP",
    disputeAction: isReceivables ? "Follow up with Customer" : "Dispute with Vendor",
  }

  // Build verification data and collect issues
  const verification = useMemo(() => {
    const issues: Issue[] = []
    let calculatedTotal = 0

    const lineVerification = invoice.lines.map(invLine => {
      const poLine = lines.find(l => l.lineNumber === invLine.lineNumber)
      const receiptLine = shipment?.lines.find(l => l.lineNumber === invLine.lineNumber)

      const ordered = poLine?.quantityOrdered || 0
      const received = receiptLine?.qtyReceived || 0
      const accepted = receiptLine?.qtyAccepted || 0
      const invoiced = invLine.qtyInvoiced

      const poPrice = poLine?.unitPrice || 0
      const invPrice = invLine.unitPrice

      // Check: invoiced qty vs received
      let qtyOk = true
      if (invoiced > accepted) {
        qtyOk = false
        issues.push({
          line: invLine.lineNumber,
          message: `Line ${invLine.lineNumber}: Invoiced ${invoiced} units but only ${accepted} accepted`,
          severity: "error",
          action: "Request corrected invoice",
        })
      } else if (invoiced > received) {
        qtyOk = false
        issues.push({
          line: invLine.lineNumber,
          message: `Line ${invLine.lineNumber}: Invoiced ${invoiced} units but only ${received} received`,
          severity: "warning",
          action: "Verify receipt",
        })
      }

      // Check: price matches PO
      let priceOk = true
      if (poPrice > 0 && Math.abs(invPrice - poPrice) > 0.01) {
        const diff = invPrice - poPrice
        const pct = (diff / poPrice * 100).toFixed(1)
        priceOk = false
        if (diff > 0) {
          issues.push({
            line: invLine.lineNumber,
            message: `Line ${invLine.lineNumber}: Invoice price ${formatCurrency(invPrice)} exceeds PO price ${formatCurrency(poPrice)} by ${pct}%`,
            severity: Math.abs(diff / poPrice) > 0.05 ? "error" : "warning",
            action: diff > 0 ? "Request corrected invoice or revise PO" : undefined,
          })
        }
      }

      // Check: line total is mathematically correct
      const expectedLineTotal = invoiced * invPrice
      const lineTotal = invLine.lineTotal
      const mathOk = Math.abs(expectedLineTotal - lineTotal) < 0.01

      if (!mathOk) {
        issues.push({
          line: invLine.lineNumber,
          message: `Line ${invLine.lineNumber}: Math error - ${invoiced} × ${formatCurrency(invPrice)} = ${formatCurrency(expectedLineTotal)}, invoice shows ${formatCurrency(lineTotal)}`,
          severity: "error",
          action: "Request corrected invoice",
        })
      }

      calculatedTotal += lineTotal

      return {
        lineNumber: invLine.lineNumber,
        sku: poLine?.sku || invLine.sku,
        name: poLine?.name || "",
        ordered,
        received,
        accepted,
        invoiced,
        poPrice,
        invPrice,
        lineTotal,
        qtyOk,
        priceOk,
        mathOk,
        allOk: qtyOk && priceOk && mathOk,
      }
    })

    // Check: invoice total matches calculated
    const totalOk = Math.abs(calculatedTotal - invoice.totalAmount) < 0.01
    if (!totalOk) {
      issues.push({
        message: `Invoice total ${formatCurrency(invoice.totalAmount)} does not match line sum ${formatCurrency(calculatedTotal)}`,
        severity: "error",
        action: "Request corrected invoice",
      })
    }

    const allOk = issues.length === 0
    const hasErrors = issues.some(i => i.severity === "error")

    // ============================================
    // FULL ANALYSIS DATA
    // ============================================

    // Fee/Charge Verification
    // Compare invoice to PO charges - what fees are on PO vs what's being charged
    const poFreight = charges.filter(c => c.type === "freight" || c.type === "shipping").reduce((s, c) => s + c.amount, 0)
    const poExpedite = charges.filter(c => c.type === "expedite").reduce((s, c) => s + c.amount, 0)
    const poHandling = charges.filter(c => c.type === "handling").reduce((s, c) => s + c.amount, 0)
    const poDuties = charges.filter(c => c.type === "duties").reduce((s, c) => s + c.amount, 0)
    const poInsurance = charges.filter(c => c.type === "insurance").reduce((s, c) => s + c.amount, 0)
    const poOther = charges.filter(c => c.type === "other").reduce((s, c) => s + c.amount, 0)

    // Line-level fees (expedite fees on lines)
    const lineExpedite = lines.reduce((s, l) => s + (l.expediteFee || 0), 0)
    const totalPOExpedite = poExpedite + lineExpedite

    const feeAnalysis = {
      freight: { onPO: poFreight, approved: poFreight > 0, status: poFreight > 0 ? "approved" as const : "not_on_po" as const },
      expedite: { onPO: totalPOExpedite, approved: totalPOExpedite > 0, status: totalPOExpedite > 0 ? "approved" as const : "not_on_po" as const },
      handling: { onPO: poHandling, approved: poHandling > 0, status: poHandling > 0 ? "approved" as const : "not_on_po" as const },
      duties: { onPO: poDuties, approved: poDuties > 0, status: poDuties > 0 ? "approved" as const : "not_on_po" as const },
      insurance: { onPO: poInsurance, approved: poInsurance > 0, status: poInsurance > 0 ? "approved" as const : "not_on_po" as const },
      other: { onPO: poOther, approved: poOther > 0, status: poOther > 0 ? "approved" as const : "not_on_po" as const },
      total: poFreight + totalPOExpedite + poHandling + poDuties + poInsurance + poOther,
    }

    // Discount Verification
    const lineDiscounts = lines.reduce((s, l) => s + (l.discountAmount || 0), 0)
    const headerDiscounts = charges.filter(c => c.type === "discount").reduce((s, c) => s + c.amount, 0)
    const totalPODiscounts = lineDiscounts + headerDiscounts
    const earlyPayDiscount = header.payment?.discount || ""
    const earlyPayPotential = earlyPayDiscount.includes("2%") ? calculatedTotal * 0.02 : 0

    const discountAnalysis = {
      lineDiscounts,
      headerDiscounts,
      totalApplied: totalPODiscounts,
      earlyPayTerms: earlyPayDiscount,
      earlyPayPotential,
      earlyPayEligible: !!earlyPayDiscount,
    }

    // Tax Verification
    const lineTaxes = lines.reduce((s, l) => s + (l.taxAmount || 0), 0)
    const headerTaxCharges = charges.filter(c => c.type === "tax").reduce((s, c) => s + c.amount, 0)
    const totalPOTax = lineTaxes + headerTaxCharges
    const taxableBase = calculatedTotal - totalPODiscounts
    const effectiveTaxRate = taxableBase > 0 ? totalPOTax / taxableBase : 0

    const taxAnalysis = {
      taxableBase,
      lineTaxes,
      headerTaxes: headerTaxCharges,
      totalTax: totalPOTax,
      effectiveRate: effectiveTaxRate,
      rateDisplay: `${(effectiveTaxRate * 100).toFixed(1)}%`,
    }

    // Timing Verification
    const invoiceDate = invoice.date
    const receiptDate = shipment?.receivedDate
    const dueDate = invoice.dueDate
    const paymentTerms = header.payment?.terms || "Net 30"

    // Parse dates for comparison (simplified)
    const invoicedBeforeReceipt = receiptDate && invoiceDate < receiptDate

    const timingAnalysis = {
      invoiceDate,
      receiptDate: receiptDate || "Not yet received",
      dueDate: dueDate || "Not specified",
      paymentTerms,
      invoicedBeforeReceipt,
      timingIssue: invoicedBeforeReceipt ? "Invoice dated before goods received" : null,
    }

    // Total Reconciliation
    const expectedTotal = calculatedTotal - totalPODiscounts + feeAnalysis.total + totalPOTax
    const invoiceTotal = invoice.totalAmount

    const totalReconciliation = {
      linesSubtotal: calculatedTotal,
      discounts: totalPODiscounts,
      afterDiscounts: calculatedTotal - totalPODiscounts,
      fees: feeAnalysis.total,
      tax: totalPOTax,
      expectedTotal,
      invoiceTotal,
      variance: invoiceTotal - expectedTotal,
      varianceOk: Math.abs(invoiceTotal - expectedTotal) < 0.01,
    }

    return {
      lines: lineVerification,
      issues,
      calculatedTotal,
      allOk,
      hasErrors,
      // Full analysis
      feeAnalysis,
      discountAnalysis,
      taxAnalysis,
      timingAnalysis,
      totalReconciliation,
    }
  }, [invoice, lines, shipment, charges, header])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-lg font-semibold">{invoice.number}</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {invoice.date} • Due {invoice.dueDate || "—"}
              {shipment && ` • ${labels.receipt} ${shipment.id}`}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "overview"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "analysis"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Full Analysis
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {activeTab === "overview" && (
            <>
              {/* Verdict */}
              {verification.allOk ? (
                <div className="flex items-start gap-3 p-4 border border-border rounded-lg border-l-2 border-l-primary bg-background">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{labels.readyMessage}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {labels.readyDescription}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {verification.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border border-border border-l-2 bg-background",
                        issue.severity === "error"
                          ? "border-l-destructive"
                          : "border-l-amber-400"
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          issue.severity === "error" ? "text-destructive" : "text-amber-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {issue.message}
                        </div>
                        {issue.action && (
                          <div className="text-xs text-muted-foreground mt-1">
                            → {issue.action}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Line Verification Table */}
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Line Verification
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Item</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ordered</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">{labels.received}</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Invoiced</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Unit Price</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verification.lines.map((line) => (
                        <tr key={line.lineNumber} className="border-t border-border">
                          <td className="py-2.5 px-3 text-muted-foreground">{line.lineNumber}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium">{line.sku}</div>
                            {line.name && (
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {line.name}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                            {line.ordered}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                            {line.accepted}
                          </td>
                          <td className={cn(
                            "py-2.5 px-3 text-right tabular-nums",
                            !line.qtyOk && "text-red-600 font-medium"
                          )}>
                            {line.invoiced}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <div className={cn(!line.priceOk && "text-red-600 font-medium")}>
                              {formatCurrency(line.invPrice)}
                            </div>
                            {!line.priceOk && line.poPrice > 0 && (
                              <div className="text-xs text-muted-foreground">
                                PO: {formatCurrency(line.poPrice)}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                            {formatCurrency(line.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 text-sm space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Line Total</span>
                    <span className="tabular-nums">{formatCurrency(verification.calculatedTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border font-medium">
                    <span>Invoice Total</span>
                    <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Link to Full Analysis */}
              <button
                onClick={() => setActiveTab("analysis")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
              >
                <span className="text-muted-foreground">View fees, discounts, tax, and timing details</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}

          {activeTab === "analysis" && (
            <>
              {/* Timing */}
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Timing
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Invoice Date</div>
                    <div className="font-medium">{verification.timingAnalysis.invoiceDate}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-muted-foreground">{labels.receipt} Date</div>
                    <div className="font-medium">{verification.timingAnalysis.receiptDate}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Due Date</div>
                    <div className="font-medium">{verification.timingAnalysis.dueDate}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Payment Terms</div>
                    <div className="font-medium">{verification.timingAnalysis.paymentTerms}</div>
                  </div>
                </div>
                {verification.timingAnalysis.timingIssue && (
                  <div className="flex items-start gap-3 mt-3 p-3 rounded-lg border border-border border-l-2 border-l-amber-400 bg-background">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{verification.timingAnalysis.timingIssue}</span>
                  </div>
                )}
              </div>

              {/* Financial Comparison Table */}
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Financial Comparison
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left py-2.5 px-4 font-medium text-muted-foreground"></th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground w-32">{labels.orderType}</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground w-32">Invoice</th>
                        <th className="text-center py-2.5 px-4 font-medium text-muted-foreground w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Lines Subtotal */}
                      <tr className="border-t border-border">
                        <td className="py-3 px-4">Lines Subtotal</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(verification.totalReconciliation.linesSubtotal)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(verification.calculatedTotal)}</td>
                        <td className="py-3 px-4 text-center">
                          {Math.abs(verification.totalReconciliation.linesSubtotal - verification.calculatedTotal) < 0.01 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" />
                          ) : verification.calculatedTotal < verification.totalReconciliation.linesSubtotal ? (
                            <span className="text-xs text-blue-600">Partial</span>
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 inline-block" />
                          )}
                        </td>
                      </tr>

                      {/* Discounts */}
                      {(verification.discountAnalysis.totalApplied > 0) && (
                        <tr className="border-t border-border">
                          <td className="py-3 px-4">Discounts</td>
                          <td className="py-3 px-4 text-right tabular-nums text-green-600">({formatCurrency(verification.discountAnalysis.totalApplied)})</td>
                          <td className="py-3 px-4 text-right tabular-nums text-green-600">({formatCurrency(verification.discountAnalysis.totalApplied)})</td>
                          <td className="py-3 px-4 text-center">
                            <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" />
                          </td>
                        </tr>
                      )}

                      {/* Freight */}
                      {verification.feeAnalysis.freight.onPO > 0 && (
                        <tr className="border-t border-border">
                          <td className="py-3 px-4 text-muted-foreground">Freight</td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{formatCurrency(verification.feeAnalysis.freight.onPO)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">—</td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      )}

                      {/* Expedite */}
                      {verification.feeAnalysis.expedite.onPO > 0 && (
                        <tr className="border-t border-border">
                          <td className="py-3 px-4 text-muted-foreground">Expedite Fees</td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{formatCurrency(verification.feeAnalysis.expedite.onPO)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">—</td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      )}

                      {/* Tax */}
                      {verification.taxAnalysis.totalTax > 0 && (
                        <tr className="border-t border-border">
                          <td className="py-3 px-4 text-muted-foreground">
                            <div>Tax ({verification.taxAnalysis.rateDisplay})</div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{formatCurrency(verification.taxAnalysis.totalTax)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">—</td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      )}

                      {/* Total */}
                      <tr className="border-t-2 border-border bg-muted/30">
                        <td className="py-3 px-4 font-semibold">Total</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(verification.totalReconciliation.expectedTotal)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatCurrency(verification.totalReconciliation.invoiceTotal)}</td>
                        <td className="py-3 px-4 text-center">
                          {verification.totalReconciliation.varianceOk ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 inline-block" />
                          ) : verification.totalReconciliation.variance < 0 ? (
                            <span className="text-xs text-blue-600">Partial</span>
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 inline-block" />
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Variance Explanation */}
              {!verification.totalReconciliation.varianceOk && (
                <div className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border border-border border-l-2 bg-background",
                  verification.totalReconciliation.variance > 0
                    ? "border-l-destructive"
                    : "border-l-primary"
                )}>
                  {verification.totalReconciliation.variance > 0 ? (
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    {verification.totalReconciliation.variance > 0 ? (
                      <>
                        <div className="font-medium">
                          Invoice exceeds {labels.orderType} by {formatCurrency(verification.totalReconciliation.variance)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {isReceivables
                            ? "Invoice amount is higher than order value. Verify pricing with customer."
                            : "Vendor charged more than approved. Request corrected invoice or revise PO."}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium">
                          Invoice is {formatCurrency(Math.abs(verification.totalReconciliation.variance))} less than full {labels.orderType}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          This may be a partial invoice. Additional invoices may follow for remaining items, fees, or tax.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Early Pay Discount */}
              {verification.discountAnalysis.earlyPayEligible && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border border-l-2 border-l-primary bg-background">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Early payment discount available</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {verification.discountAnalysis.earlyPayTerms} — Save up to {formatCurrency(verification.discountAnalysis.earlyPayPotential)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {verification.allOk
              ? "All checks passed"
              : `${verification.issues.length} issue${verification.issues.length > 1 ? "s" : ""} found`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {verification.hasErrors && (
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                {labels.disputeAction}
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {labels.messageTeam}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
