"use client"

import { cn } from "@/lib/utils"
import {
  Package,
  Percent,
  Truck,
  Receipt,
  CreditCard,
  Tag,
  Zap,
  FileText,
  DollarSign,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialLineItem {
  id: string | number
  label: string
  description?: string
  quantity: number
  unitPrice: number
  subtotal: number
  discount?: number
  discountPercent?: number
}

export interface FinancialCharge {
  id: string
  type: "shipping" | "freight" | "handling" | "expedite" | "duties" | "insurance" | "other"
  label: string
  amount: number
  taxable?: boolean
  allocated?: number // For invoices: portion allocated from order
}

export interface FinancialDiscount {
  id: string
  label: string
  amount: number
  percent?: number
}

export interface FinancialTax {
  label: string
  rate: number
  onLines: number
  onCharges: number
  total: number
}

export interface PaymentStatus {
  invoiced: number
  paid: number
  balance: number
}

export interface FinancialBreakdownData {
  lines: FinancialLineItem[]
  linesSubtotal: number

  discounts?: FinancialDiscount[]
  discountsTotal?: number
  netLines?: number

  charges?: FinancialCharge[]
  chargesTotal?: number

  tax?: FinancialTax

  grandTotal: number

  // For invoices/payables/receivables
  payment?: PaymentStatus

  // Comparison to order (for invoice views)
  orderTotal?: number
}

export interface FinancialBreakdownProps {
  data: FinancialBreakdownData

  // Display options
  variant?: "full" | "compact" | "summary"
  showLines?: boolean
  showLineDetails?: boolean
  showChargeIcons?: boolean

  // Labels
  title?: string
  linesLabel?: string
  totalLabel?: string

  // Styling
  className?: string
}

// ============================================================================
// CHARGE ICON MAPPING
// ============================================================================

const chargeIcons: Record<string, React.ElementType> = {
  shipping: Truck,
  freight: Truck,
  handling: Package,
  expedite: Zap,
  duties: FileText,
  insurance: FileText,
  other: Receipt,
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FinancialBreakdown({
  data,
  variant = "full",
  showLines = true,
  showLineDetails = true,
  showChargeIcons = true,
  title,
  linesLabel = "Lines",
  totalLabel = "Total",
  className,
}: FinancialBreakdownProps) {
  const {
    lines,
    linesSubtotal,
    discounts,
    discountsTotal = 0,
    netLines = linesSubtotal - discountsTotal,
    charges,
    chargesTotal = 0,
    tax,
    grandTotal,
    payment,
    orderTotal,
  } = data

  const hasDiscounts = discounts && discounts.length > 0 && discountsTotal > 0
  const hasCharges = charges && charges.length > 0 && chargesTotal > 0
  const hasTax = tax && tax.total > 0
  const hasPayment = payment !== undefined

  // Summary variant - just totals
  if (variant === "summary") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{linesLabel}</span>
          <span className="tabular-nums">{formatCurrency(linesSubtotal)}</span>
        </div>
        {hasCharges && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Charges</span>
            <span className="tabular-nums">{formatCurrency(chargesTotal)}</span>
          </div>
        )}
        {hasTax && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatCurrency(tax.total)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
          <span>{totalLabel}</span>
          <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {title && (
        <div className="pb-3 mb-3 border-b border-border">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}

      {/* Lines Section */}
      {showLines && lines.length > 0 && (
        <div className="pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{linesLabel}</span>
          </div>

          {showLineDetails && variant === "full" ? (
            <div className="space-y-2 mb-3">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between text-sm">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded bg-muted text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {line.id}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{line.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.quantity} × {formatCurrency(line.unitPrice)}
                        {line.discountPercent && line.discountPercent > 0 && (
                          <span className="text-green-600 ml-1">(-{line.discountPercent}%)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="tabular-nums flex-shrink-0 ml-3">{formatCurrency(line.subtotal)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mb-2">
              {lines.length} item{lines.length !== 1 ? "s" : ""}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lines Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(linesSubtotal)}</span>
          </div>
        </div>
      )}

      {/* Discounts Section */}
      {hasDiscounts && (
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discounts</span>
          </div>

          {variant === "full" && (
            <div className="space-y-1.5 mb-2">
              {discounts!.map((discount) => (
                <div key={discount.id} className="flex justify-between text-sm text-green-600">
                  <span>
                    {discount.label}
                    {discount.percent && <span className="text-muted-foreground ml-1">({discount.percent}%)</span>}
                  </span>
                  <span className="tabular-nums">-{formatCurrency(discount.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net Amount</span>
            <span className="font-medium tabular-nums">{formatCurrency(netLines)}</span>
          </div>
        </div>
      )}

      {/* Charges Section */}
      {hasCharges && (
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Charges & Fees</span>
          </div>

          <div className="space-y-1.5 mb-2">
            {charges!.map((charge) => {
              const Icon = showChargeIcons ? chargeIcons[charge.type] || Receipt : null
              return (
                <div key={charge.id} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span>{charge.label}</span>
                    {charge.taxable && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">taxable</span>
                    )}
                  </span>
                  <span className="tabular-nums">{formatCurrency(charge.amount)}</span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Charges Total</span>
            <span className="font-medium tabular-nums">{formatCurrency(chargesTotal)}</span>
          </div>
        </div>
      )}

      {/* Tax Section */}
      {hasTax && (
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tax ({(tax.rate * 100).toFixed(2)}%)</span>
          </div>

          {variant === "full" && (tax.onLines > 0 || tax.onCharges > 0) && (
            <div className="space-y-1.5 mb-2">
              {tax.onLines > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>On lines</span>
                  <span className="tabular-nums">{formatCurrency(tax.onLines)}</span>
                </div>
              )}
              {tax.onCharges > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>On charges</span>
                  <span className="tabular-nums">{formatCurrency(tax.onCharges)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax Total</span>
            <span className="font-medium tabular-nums">{formatCurrency(tax.total)}</span>
          </div>
        </div>
      )}

      {/* Grand Total */}
      <div className="pt-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{totalLabel}</span>
          <span className="text-lg font-bold tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>

        {/* Comparison to order total (for invoice views) */}
        {orderTotal !== undefined && orderTotal !== grandTotal && (
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>of {formatCurrency(orderTotal)} order total</span>
            <span>{((grandTotal / orderTotal) * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Payment Status (for invoices) */}
      {hasPayment && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Status</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoiced</span>
              <span className="tabular-nums">{formatCurrency(payment.invoiced)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span className="tabular-nums text-green-600">{formatCurrency(payment.paid)}</span>
            </div>
            <div className={cn(
              "flex justify-between text-sm font-medium pt-1.5 border-t border-border",
              payment.balance > 0 ? "text-amber-600" : "text-green-600"
            )}>
              <span>Balance Due</span>
              <span className="tabular-nums">{formatCurrency(payment.balance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPACT HORIZONTAL BREAKDOWN (for summaries)
// ============================================================================

export function FinancialSummaryBar({
  linesSubtotal,
  chargesTotal = 0,
  taxTotal = 0,
  grandTotal,
  className,
}: {
  linesSubtotal: number
  chargesTotal?: number
  taxTotal?: number
  grandTotal: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Lines:</span>
        <span className="font-medium tabular-nums">{formatCurrency(linesSubtotal)}</span>
      </div>
      {chargesTotal > 0 && (
        <>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Charges:</span>
            <span className="font-medium tabular-nums">{formatCurrency(chargesTotal)}</span>
          </div>
        </>
      )}
      {taxTotal > 0 && (
        <>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium tabular-nums">{formatCurrency(taxTotal)}</span>
          </div>
        </>
      )}
      <span className="text-muted-foreground">=</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold tabular-nums">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  )
}

// ============================================================================
// PAYMENT PROGRESS BAR
// ============================================================================

export function PaymentProgressBar({
  total,
  invoiced,
  paid,
  className,
}: {
  total: number
  invoiced: number
  paid: number
  className?: string
}) {
  const invoicedPercent = Math.min((invoiced / total) * 100, 100)
  const paidPercent = Math.min((paid / total) * 100, 100)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Payment Progress</span>
        <span>{formatCurrency(paid)} of {formatCurrency(total)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
        {/* Invoiced background */}
        <div
          className="absolute inset-y-0 left-0 bg-blue-200 rounded-full transition-all"
          style={{ width: `${invoicedPercent}%` }}
        />
        {/* Paid foreground */}
        <div
          className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all"
          style={{ width: `${paidPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Paid ({((paid / total) * 100).toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-200" />
          <span className="text-muted-foreground">Invoiced ({((invoiced / total) * 100).toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
