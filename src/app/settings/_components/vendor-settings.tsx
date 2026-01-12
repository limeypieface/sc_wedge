"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PurchasingConfiguration } from "@/types/configuration.types";

interface VendorSettingsProps {
  config: PurchasingConfiguration;
  onChange: (updates: Partial<PurchasingConfiguration>) => void;
}

export function VendorSettings({ config, onChange }: VendorSettingsProps) {
  const { vendor } = config;

  const update = (updates: Partial<typeof vendor>) => {
    onChange({ vendor: { ...vendor, ...updates } });
  };

  const updateMetrics = (updates: Partial<typeof vendor.performanceMetrics>) => {
    update({ performanceMetrics: { ...vendor.performanceMetrics, ...updates } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Vendor Management</h2>
        <p className="text-muted-foreground mt-1">
          Configure vendor qualification and performance tracking.
        </p>
      </div>

      {/* Approved Vendor List */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div>
          <p className="font-medium">Require Approved Vendors</p>
          <p className="text-sm text-muted-foreground">
            Only allow purchases from pre-approved vendors
          </p>
        </div>
        <Switch
          checked={vendor.requireApprovedVendor}
          onCheckedChange={(v) => update({ requireApprovedVendor: v })}
        />
      </div>

      <Separator />

      {/* Qualification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Vendor Qualification</Label>
            <p className="text-sm text-muted-foreground">
              Require qualification process before approval
            </p>
          </div>
          <Switch
            checked={vendor.qualificationEnabled}
            onCheckedChange={(v) => update({ qualificationEnabled: v })}
          />
        </div>
      </div>

      <Separator />

      {/* Scorecarding */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Vendor Scorecarding</Label>
            <p className="text-sm text-muted-foreground">
              Track and score vendor performance
            </p>
          </div>
          <Switch
            checked={vendor.scorecardEnabled}
            onCheckedChange={(v) => update({ scorecardEnabled: v })}
          />
        </div>

        {vendor.scorecardEnabled && (
          <>
            <div className="pl-4 space-y-3 border-l-2 border-muted">
              <Label className="text-sm font-medium">Metrics to Track</Label>

              <div className="flex items-center justify-between">
                <Label className="text-sm">On-Time Delivery</Label>
                <Switch
                  checked={vendor.performanceMetrics.onTimeDelivery}
                  onCheckedChange={(v) => updateMetrics({ onTimeDelivery: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Quality Score</Label>
                <Switch
                  checked={vendor.performanceMetrics.qualityScore}
                  onCheckedChange={(v) => updateMetrics({ qualityScore: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Price Competitiveness</Label>
                <Switch
                  checked={vendor.performanceMetrics.priceCompetitiveness}
                  onCheckedChange={(v) => updateMetrics({ priceCompetitiveness: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Responsiveness</Label>
                <Switch
                  checked={vendor.performanceMetrics.responsiveness}
                  onCheckedChange={(v) => updateMetrics({ responsiveness: v })}
                />
              </div>
            </div>

            <div className="space-y-2 pl-4">
              <Label className="text-sm">Auto-disqualify threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={vendor.autoDisqualifyThreshold || ""}
                  onChange={(e) =>
                    update({
                      autoDisqualifyThreshold: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-20"
                  min={0}
                  max={100}
                  placeholder="None"
                />
                <span className="text-sm text-muted-foreground">
                  Score below this triggers review
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Documentation */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Documentation Requirements</Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Require insurance certificate</Label>
            <Switch
              checked={vendor.requireInsurance}
              onCheckedChange={(v) => update({ requireInsurance: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Require tax documents (W-9)</Label>
            <Switch
              checked={vendor.requireTaxDocuments}
              onCheckedChange={(v) => update({ requireTaxDocuments: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
