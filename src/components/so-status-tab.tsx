"use client";

/**
 * SOStatusTab
 *
 * Clean, minimalist view of sales order fulfillment status.
 * Matches the subtle design language of the rest of the application.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Factory,
  ExternalLink,
  Circle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getSOFulfillmentSummary,
  getManufacturingOrdersForSO,
  getAllShortages,
  type ComponentShortage,
} from "@/lib/so-fulfillment-data";
import type {
  ManufacturingOrder,
  MOComponent,
  MOOperation,
  DeliveryRisk,
} from "@/types/manufacturing-order.types";

// ============================================================================
// TYPES
// ============================================================================

interface SOStatusTabProps {
  soNumber: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatStatus = (status: ManufacturingOrder["status"]) => {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SOStatusTab({ soNumber }: SOStatusTabProps) {
  const summary = useMemo(() => getSOFulfillmentSummary(soNumber), [soNumber]);
  const manufacturingOrders = useMemo(() => getManufacturingOrdersForSO(soNumber), [soNumber]);
  const shortages = useMemo(() => getAllShortages(soNumber), [soNumber]);

  const [expandedMO, setExpandedMO] = useState<string | null>(null);

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No production data available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          This order may be fulfilled from stock
        </p>
      </div>
    );
  }

  const criticalShortages = shortages.filter((s) => s.isCritical);

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* DELIVERY STATUS CARD */}
      {/* ================================================================== */}
      <Card className="border border-border">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Delivery Status</div>
              <div className="flex items-center gap-2">
                {summary.overallRisk === "on_track" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : summary.overallRisk === "at_risk" ? (
                  <Clock className="w-4 h-4 text-amber-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  summary.overallRisk === "on_track" ? "text-primary" :
                  summary.overallRisk === "at_risk" ? "text-amber-600" :
                  "text-destructive"
                )}>
                  {summary.overallRisk === "on_track" && "On Track"}
                  {summary.overallRisk === "at_risk" && "At Risk"}
                  {summary.overallRisk === "late" && "Delayed"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
                {summary.riskSummary}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Promise Date</div>
              <div className="text-sm font-medium">{summary.promisedDeliveryDate}</div>
              {summary.projectedDeliveryDate && summary.overallRisk !== "on_track" && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Projected</div>
                  <div className={cn(
                    "text-sm font-medium",
                    summary.overallRisk === "late" ? "text-destructive" : "text-amber-600"
                  )}>
                    {summary.projectedDeliveryDate}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Production</div>
              <div className="text-sm">
                <span className="font-medium">{summary.mosComplete}</span>
                <span className="text-muted-foreground"> / {summary.totalMOs} complete</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lines</div>
              <div className="text-sm">
                <span className="font-medium text-primary">{summary.linesOnTrack}</span>
                <span className="text-muted-foreground"> on track</span>
                {summary.linesAtRisk > 0 && (
                  <span className="text-amber-600 ml-1">· {summary.linesAtRisk} at risk</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Shortages</div>
              <div className="text-sm">
                {summary.totalShortages > 0 ? (
                  <>
                    <span className={cn("font-medium", summary.criticalShortages > 0 && "text-destructive")}>
                      {summary.totalShortages}
                    </span>
                    <span className="text-muted-foreground"> components</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Open POs</div>
              <div className="text-sm">
                <span className="font-medium">{summary.openPurchaseOrders}</span>
                <span className="text-muted-foreground"> pending</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================== */}
      {/* CRITICAL SHORTAGES */}
      {/* ================================================================== */}
      {criticalShortages.length > 0 && (
        <Card className="border border-border">
          <div className="px-6 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-foreground">
              Critical Shortages ({criticalShortages.length})
            </span>
          </div>
          <div className="divide-y divide-border">
            {criticalShortages.map((shortage) => (
              <ShortageRow key={shortage.id} shortage={shortage} />
            ))}
          </div>
        </Card>
      )}

      {/* ================================================================== */}
      {/* MANUFACTURING ORDERS */}
      {/* ================================================================== */}
      <Card className="border border-border">
        <div className="px-6 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Production Orders</div>
        </div>
        <div className="divide-y divide-border">
          {manufacturingOrders.map((mo) => (
            <ManufacturingOrderRow
              key={mo.id}
              manufacturingOrder={mo}
              isExpanded={expandedMO === mo.id}
              onToggle={() => setExpandedMO(expandedMO === mo.id ? null : mo.id)}
            />
          ))}
        </div>
      </Card>

      {/* ================================================================== */}
      {/* OTHER SHORTAGES */}
      {/* ================================================================== */}
      {shortages.length > 0 && criticalShortages.length === 0 && (
        <Card className="border border-border">
          <div className="px-6 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">
              Component Shortages ({shortages.length})
            </span>
          </div>
          <div className="divide-y divide-border">
            {shortages.map((shortage) => (
              <ShortageRow key={shortage.id} shortage={shortage} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// MANUFACTURING ORDER ROW
// ============================================================================

interface ManufacturingOrderRowProps {
  manufacturingOrder: ManufacturingOrder;
  isExpanded: boolean;
  onToggle: () => void;
}

function ManufacturingOrderRow({ manufacturingOrder, isExpanded, onToggle }: ManufacturingOrderRowProps) {
  const mo = manufacturingOrder;

  const getStatusBadge = () => {
    switch (mo.status) {
      case "complete":
        return <Badge className="bg-primary/10 text-primary border-0 text-xs">Complete</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">In Progress</Badge>;
      case "on_hold":
        return <Badge className="bg-destructive/10 text-destructive border-0 text-xs">On Hold</Badge>;
      case "released":
        return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Released</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{formatStatus(mo.status)}</Badge>;
    }
  };

  return (
    <div>
      {/* Row Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Expand Icon */}
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
              isExpanded && "rotate-90"
            )}
          />

          {/* MO Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{mo.moNumber}</span>
              {getStatusBadge()}
              {mo.hasShortages && (
                <span className="text-xs text-destructive">
                  {mo.shortageCount} shortage{mo.shortageCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-foreground">{mo.itemName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {mo.itemSku} · Line {mo.salesOrderLine}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm font-medium tabular-nums">
                {mo.quantityComplete} / {mo.quantityOrdered}
              </div>
              <div className="text-xs text-muted-foreground">units</div>
            </div>
            <div className="w-24">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    mo.status === "complete" ? "bg-primary" :
                    mo.deliveryRisk === "late" ? "bg-destructive" :
                    mo.deliveryRisk === "at_risk" ? "bg-amber-500" :
                    "bg-primary"
                  )}
                  style={{ width: `${mo.percentComplete}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right mt-1 tabular-nums">
                {mo.percentComplete}%
              </div>
            </div>
            <div className="text-right w-24">
              <div className="text-xs text-muted-foreground">Due</div>
              <div className={cn(
                "text-sm",
                mo.deliveryRisk === "late" ? "text-destructive font-medium" :
                mo.deliveryRisk === "at_risk" ? "text-amber-600" :
                "text-foreground"
              )}>
                {mo.requiredDate}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-4 pt-0 ml-8 space-y-4">
          {/* Risk Reasons */}
          {mo.riskReasons && mo.riskReasons.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              {mo.riskReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Operations */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Operations</div>
            <div className="space-y-1">
              {mo.operations.map((op) => (
                <div key={op.id} className="flex items-center gap-3 text-sm">
                  <div className="w-4 flex justify-center">
                    {op.status === "complete" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    ) : op.status === "in_progress" ? (
                      <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8">
                    {op.operationNumber}
                  </span>
                  <span className="flex-1">{op.name}</span>
                  <span className="text-xs text-muted-foreground">{op.workCenter}</span>
                  <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">
                    {op.quantityComplete}/{op.quantityComplete + op.quantityInProcess}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Components with Issues */}
          {mo.hasShortages && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Component Shortages</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left py-1 font-medium">Component</th>
                    <th className="text-right py-1 font-medium w-16">Need</th>
                    <th className="text-right py-1 font-medium w-16">Have</th>
                    <th className="text-right py-1 font-medium w-16">Short</th>
                    <th className="text-left py-1 font-medium pl-4">Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {mo.components
                    .filter((c) => c.status === "short" || c.status === "on_order")
                    .map((c) => (
                      <tr key={c.id} className="border-t border-border/50">
                        <td className="py-2">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{c.sku}</div>
                        </td>
                        <td className="py-2 text-right tabular-nums">{c.quantityRequired}</td>
                        <td className="py-2 text-right tabular-nums">{c.quantityOnHand + c.quantityAllocated}</td>
                        <td className="py-2 text-right">
                          {c.quantityShort > 0 ? (
                            <span className="text-destructive tabular-nums">-{c.quantityShort}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pl-4">
                          {c.purchaseOrders && c.purchaseOrders.length > 0 ? (
                            <div className="space-y-0.5">
                              {c.purchaseOrders.map((po) => (
                                <div key={po.poNumber} className="text-xs">
                                  <Link href={`/po/${po.poNumber}`} className="text-primary hover:underline font-mono">
                                    {po.poNumber}
                                  </Link>
                                  <span className="text-muted-foreground ml-1">
                                    {po.quantity} · {po.expectedDate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : c.quantityShort > 0 ? (
                            <span className="text-xs text-destructive">No PO</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* View MO Link */}
          <div className="pt-2">
            <button className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View Manufacturing Order
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHORTAGE ROW
// ============================================================================

interface ShortageRowProps {
  shortage: ComponentShortage;
}

function ShortageRow({ shortage }: ShortageRowProps) {
  return (
    <div className="px-6 py-3 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{shortage.name}</span>
          <span className="text-xs font-mono text-muted-foreground">{shortage.sku}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          For {shortage.moNumber} · {shortage.moItem}
        </div>
        {shortage.purchaseOrders.length > 0 ? (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Supply:</span>
            {shortage.purchaseOrders.map((po) => (
              <Link
                key={po.poNumber}
                href={`/po/${po.poNumber}`}
                className="text-primary hover:underline font-mono"
              >
                {po.poNumber}
              </Link>
            ))}
            {shortage.quantityOnOrder < shortage.quantityShort && (
              <span className="text-destructive">
                {shortage.quantityShort - shortage.quantityOnOrder} uncovered
              </span>
            )}
          </div>
        ) : (
          <div className="mt-1.5 text-xs text-destructive">
            No purchase order
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className={cn(
          "text-sm font-medium tabular-nums",
          shortage.isCritical ? "text-destructive" : "text-amber-600"
        )}>
          -{shortage.quantityShort}
        </div>
        <div className="text-xs text-muted-foreground">short</div>
      </div>
    </div>
  );
}
