"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PurchasingConfiguration } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

interface InvoiceSettingsProps {
  config: PurchasingConfiguration;
  onChange: (updates: Partial<PurchasingConfiguration>) => void;
}

export function InvoiceSettings({ config, onChange }: InvoiceSettingsProps) {
  const { receiving } = config;

  const update = (updates: Partial<typeof receiving>) => {
    onChange({ receiving: { ...receiving, ...updates } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Invoice & Payment</h2>
        <p className="text-muted-foreground mt-1">
          Configure how invoices are matched and payments are controlled.
        </p>
      </div>

      {/* Matching Mode */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Invoice Matching</Label>
        <p className="text-sm text-muted-foreground">
          Choose how invoices are verified before payment.
        </p>

        <div className="grid gap-3">
          <button
            onClick={() => update({ threeWayMatchEnabled: false })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              !receiving.threeWayMatchEnabled
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <p className="font-medium">Two-Way Match</p>
            <p className="text-sm text-muted-foreground mt-1">
              Match invoice to purchase order only. Trust that goods were received.
            </p>
          </button>

          <button
            onClick={() => update({ threeWayMatchEnabled: true })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              receiving.threeWayMatchEnabled
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <p className="font-medium">Three-Way Match</p>
            <p className="text-sm text-muted-foreground mt-1">
              Match invoice to both PO and receipt. Verify goods were received before paying.
            </p>
          </button>
        </div>
      </div>

      {receiving.threeWayMatchEnabled && (
        <>
          <Separator />

          {/* Tolerances */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Match Tolerances</Label>
            <p className="text-sm text-muted-foreground">
              Allow small variances without requiring exception handling.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Price variance</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={receiving.priceTolerance}
                    onChange={(e) => update({ priceTolerance: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {receiving.priceTolerance === 0 ? "Exact price match required" : `Up to ${receiving.priceTolerance}% variance allowed`}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Quantity variance</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={receiving.quantityTolerance}
                    onChange={(e) => update({ quantityTolerance: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {receiving.quantityTolerance === 0 ? "Exact quantity match required" : `Up to ${receiving.quantityTolerance}% variance allowed`}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Payment Controls */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Payment Controls</Label>
        <p className="text-sm text-muted-foreground">
          Additional controls before releasing payment.
        </p>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Payment hold rules are configured in the Quality Processes section when NCR or quality holds are enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
