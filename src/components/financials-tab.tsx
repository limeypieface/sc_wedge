"use client"

import { useState, useMemo } from "react"
import {
  invoices,
  lineItems as defaultLineItems,
  shipments as defaultShipments,
  detectPOIssues,
  poCharges as defaultPoCharges,
  type Invoice,
  type LineItem,
  type POCharge,
  type Shipment,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { InvoiceDetailModal } from "@/components/invoice-detail-modal"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react"

interface FinancialsTabProps {
  lines?: LineItem[]
  charges?: POCharge[]
  shipments?: Shipment[]
  poNumber?: string
  variant?: "payables" | "receivables"
}

type ViewMode = "quantity" | "finances"

export function FinancialsTab({
  lines = defaultLineItems,
  charges = defaultPoCharges,
  shipments = defaultShipments,
  poNumber,
  variant = "payables",
}: FinancialsTabProps) {
  const [modalInvoice, setModalInvoice] = useState<Invoice | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("finances")
  const allIssues = detectPOIssues()

  // Filter to goods lines only (exclude service lines)
  const goodsLines = useMemo(() => {
    return lines.filter(line => !line.sku?.startsWith("SVC-"))
  }, [lines])

  // Compute line-level financials
  const lineFinancials = useMemo(() => {
    return goodsLines.map(line => {
      const lineInvoices = invoices.flatMap(inv =>
        inv.lines.filter(l => l.lineNumber === line.lineNumber)
      )
      const invoicedQty = lineInvoices.reduce((sum, l) => sum + l.qtyInvoiced, 0)
      const invoicedAmount = lineInvoices.reduce((sum, l) => sum + l.lineTotal, 0)
      const poValue = line.lineTotal
      const variance = poValue - invoicedAmount

      return {
        lineNumber: line.lineNumber,
        sku: line.sku,
        name: line.name,
        ordered: line.quantityOrdered || line.quantity,
        accepted: line.quantityAccepted || 0,
        qualityHold: line.quantityInQualityHold || 0,
        invoiced: invoicedQty,
        paid: line.quantityPaid || 0,
        poValue,
        invoicedAmount,
        variance,
      }
    })
  }, [goodsLines])

  // Compute totals
  const totals = useMemo(() => {
    const ordered = lineFinancials.reduce((sum, l) => sum + l.ordered, 0)
    const accepted = lineFinancials.reduce((sum, l) => sum + l.accepted, 0)
    const invoiced = lineFinancials.reduce((sum, l) => sum + l.invoiced, 0)
    const paid = lineFinancials.reduce((sum, l) => sum + l.paid, 0)
    const poValue = lineFinancials.reduce((sum, l) => sum + l.poValue, 0)
    const invoicedAmount = lineFinancials.reduce((sum, l) => sum + l.invoicedAmount, 0)
    const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0)
    const variance = lineFinancials.reduce((sum, l) => sum + l.variance, 0)

    return { ordered, accepted, invoiced, paid, poValue, invoicedAmount, chargesTotal, variance }
  }, [lineFinancials, charges])

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-0.5 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setViewMode("quantity")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            viewMode === "quantity"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Quantity
        </button>
        <button
          onClick={() => setViewMode("finances")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            viewMode === "finances"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Finances
        </button>
        </div>
      </div>

      {/* Line Tracking */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {viewMode === "quantity" ? "Quantity Tracking" : "Financial Tracking"}
        </h4>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-8">#</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</th>
                {viewMode === "quantity" ? (
                  <>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ordered</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {variant === "receivables" ? "Shipped" : "Accepted"}
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoiced</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {variant === "receivables" ? "Collected" : "Paid"}
                    </th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {variant === "receivables" ? "SO Value" : "PO Value"}
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoiced</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Variance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineFinancials.map((line) => (
                <tr key={line.lineNumber} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 text-muted-foreground">{line.lineNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium">{line.sku}</p>
                    <p className="text-xs text-muted-foreground">{line.name}</p>
                  </td>
                  {viewMode === "quantity" ? (
                    <>
                      <td className="py-2.5 px-3 text-right tabular-nums">{line.ordered}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {line.accepted}
                        {line.qualityHold > 0 && (
                          <span className="text-amber-600 text-xs ml-1">+{line.qualityHold} QH</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {line.invoiced > 0 ? line.invoiced : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {line.paid > 0 ? line.paid : "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatCurrency(line.poValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {line.invoicedAmount > 0 ? formatCurrency(line.invoicedAmount) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {line.variance > 0 ? (
                          <span className="text-muted-foreground">
                            ({formatCurrency(line.variance)})
                          </span>
                        ) : line.variance < 0 ? (
                          <span className="text-destructive">
                            +{formatCurrency(Math.abs(line.variance))}
                          </span>
                        ) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Order Charges - only in finances view */}
              {viewMode === "finances" && charges.length > 0 && (
                <tr>
                  <td className="py-2.5 px-3 text-muted-foreground">—</td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium">Order Charges</p>
                    <p className="text-xs text-muted-foreground">
                      {charges.map(c => c.description).join(", ")}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatCurrency(totals.chargesTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                </tr>
              )}

              {/* Total Row */}
              <tr className="bg-foreground/5">
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 font-semibold">Total</td>
                {viewMode === "quantity" ? (
                  <>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">{totals.ordered}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">{totals.accepted}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">{totals.invoiced}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">{totals.paid || "—"}</td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {formatCurrency(totals.poValue + totals.chargesTotal)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {formatCurrency(totals.invoicedAmount)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {totals.variance > 0 ? (
                        <span className="text-muted-foreground">
                          ({formatCurrency(totals.variance)})
                        </span>
                      ) : totals.variance < 0 ? (
                        <span className="text-destructive">
                          +{formatCurrency(Math.abs(totals.variance))}
                        </span>
                      ) : "—"}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Invoices ({invoices.length})
        </h3>
        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map(invoice => {
              const issue = allIssues.find(i => i.invoiceId === invoice.id)
              const hasIssue = invoice.status === "disputed" || invoice.status === "variance" || issue
              const lineCount = invoice.lines.length

              const getStatusIcon = () => {
                if (invoice.status === "paid") return <CheckCircle2 className="w-5 h-5 text-primary" />
                if (hasIssue) return <AlertTriangle className="w-5 h-5 text-amber-500" />
                if (invoice.status === "matched") return <CheckCircle2 className="w-5 h-5 text-primary" />
                return <Clock className="w-5 h-5 text-muted-foreground" />
              }

              const getStatusBorder = () => {
                if (invoice.status === "paid") return "border-l-primary"
                if (hasIssue) return "border-l-amber-400"
                if (invoice.status === "matched") return "border-l-primary"
                return "border-l-border"
              }

              const getStatusLabel = () => {
                if (invoice.status === "disputed") return "Disputed"
                if (invoice.status === "variance") return "Variance"
                return invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
              }

              return (
                <button
                  key={invoice.id}
                  onClick={() => setModalInvoice(invoice)}
                  className={cn(
                    "w-full text-left border border-border rounded-lg overflow-hidden border-l-2 bg-background hover:bg-muted/30 transition-colors",
                    getStatusBorder()
                  )}
                >
                  <div className="flex items-center gap-4 p-3">
                    <div className="flex-shrink-0">{getStatusIcon()}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-sm font-medium">{invoice.number}</span>
                        <span className="text-xs text-muted-foreground">
                          {lineCount} {lineCount === 1 ? "line" : "lines"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {variant === "receivables" ? "Sent" : "Received"} {invoice.date} · Due {invoice.dueDate || "—"}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-border">
            <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {variant === "receivables" ? "No invoices sent yet" : "No invoices received yet"}
            </p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {modalInvoice && (
        <InvoiceDetailModal
          isOpen={!!modalInvoice}
          onClose={() => setModalInvoice(null)}
          invoice={modalInvoice}
          lines={lines}
          shipments={shipments}
          charges={charges}
          poNumber={poNumber}
          variant={variant}
        />
      )}
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
