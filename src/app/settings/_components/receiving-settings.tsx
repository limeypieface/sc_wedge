"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PurchasingConfiguration } from "@/types/configuration.types";

interface ReceivingSettingsProps {
  config: PurchasingConfiguration;
  onChange: (updates: Partial<PurchasingConfiguration>) => void;
}

export function ReceivingSettings({ config, onChange }: ReceivingSettingsProps) {
  const { receiving } = config;

  const update = (updates: Partial<typeof receiving>) => {
    onChange({ receiving: { ...receiving, ...updates } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Receiving</h2>
        <p className="text-muted-foreground mt-1">
          Configure how goods are received and validated.
        </p>
      </div>

      {/* Quantity Tolerances */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Quantity Tolerances</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Under-receive tolerance</Label>
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
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Price tolerance</Label>
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
          </div>
        </div>
      </div>

      <Separator />

      {/* Over-receiving */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow Over-Receiving</Label>
            <p className="text-sm text-muted-foreground">Accept more than ordered quantity</p>
          </div>
          <Switch
            checked={receiving.allowOverReceive}
            onCheckedChange={(v) => update({ allowOverReceive: v })}
          />
        </div>

        {receiving.allowOverReceive && (
          <div className="flex items-center gap-2 pl-4">
            <Label className="text-sm">Maximum:</Label>
            <Input
              type="number"
              value={receiving.maxOverReceivePercent}
              onChange={(e) => update({ maxOverReceivePercent: parseFloat(e.target.value) || 0 })}
              className="w-20 h-8"
              min={0}
              max={100}
            />
            <span className="text-sm text-muted-foreground">% over ordered quantity</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Tracking */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Tracking Requirements</Label>
        <p className="text-sm text-muted-foreground">
          These are organization-wide defaults. Individual items can override.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm">Lot Tracking</p>
              <p className="text-xs text-muted-foreground">Track materials by supplier lot</p>
            </div>
            <Switch
              checked={receiving.lotTrackingEnabled}
              onCheckedChange={(v) => update({ lotTrackingEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm">Serial Number Tracking</p>
              <p className="text-xs text-muted-foreground">Track individual items by serial</p>
            </div>
            <Switch
              checked={receiving.serialTrackingEnabled}
              onCheckedChange={(v) => update({ serialTrackingEnabled: v })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Workflow Options */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Workflow Options</Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Require packing slip</Label>
            <Switch
              checked={receiving.requirePackingSlip}
              onCheckedChange={(v) => update({ requirePackingSlip: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Auto-close lines when fully received</Label>
            <Switch
              checked={receiving.autoCloseOnFullReceipt}
              onCheckedChange={(v) => update({ autoCloseOnFullReceipt: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
