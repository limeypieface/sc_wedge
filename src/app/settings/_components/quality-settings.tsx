"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PurchasingConfiguration } from "@/types/configuration.types";

interface QualitySettingsProps {
  config: PurchasingConfiguration;
  onChange: (updates: Partial<PurchasingConfiguration>) => void;
}

export function QualitySettings({ config, onChange }: QualitySettingsProps) {
  const { quality } = config;

  const update = (updates: Partial<typeof quality>) => {
    onChange({ quality: { ...quality, ...updates } });
  };

  const updateNCR = (updates: Partial<typeof quality.ncr>) => {
    update({ ncr: { ...quality.ncr, ...updates } });
  };

  const updateHold = (updates: Partial<typeof quality.qualityHold>) => {
    update({ qualityHold: { ...quality.qualityHold, ...updates } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Quality Processes</h2>
        <p className="text-muted-foreground mt-1">
          Configure NCR workflow and quality hold policies.
        </p>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Inspection requirements are set per item category in the Item Master.
          These settings control the <em>processes</em> for handling quality issues.
        </p>
      </div>

      {/* Enable Quality */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div>
          <p className="font-medium">Enable Quality Tracking</p>
          <p className="text-sm text-muted-foreground">
            Track non-conformances and quality holds
          </p>
        </div>
        <Switch
          checked={quality.enabled}
          onCheckedChange={(enabled) => update({ enabled })}
        />
      </div>

      {quality.enabled && (
        <>
          <Separator />

          {/* NCR Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Non-Conformance Reports (NCR)</Label>
                <p className="text-sm text-muted-foreground">Track and resolve quality issues</p>
              </div>
              <Switch
                checked={quality.ncr.enabled}
                onCheckedChange={(v) => updateNCR({ enabled: v })}
              />
            </div>

            {quality.ncr.enabled && (
              <div className="pl-4 space-y-3 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Auto-create NCR on inspection failure</Label>
                  <Switch
                    checked={quality.ncr.autoCreateOnFailure}
                    onCheckedChange={(v) => updateNCR({ autoCreateOnFailure: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Require disposition before closing</Label>
                  <Switch
                    checked={quality.ncr.requireDisposition}
                    onCheckedChange={(v) => updateNCR({ requireDisposition: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Notify supplier when NCR created</Label>
                  <Switch
                    checked={quality.ncr.notifySupplier}
                    onCheckedChange={(v) => updateNCR({ notifySupplier: v })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Quality Hold Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Quality Holds</Label>
                <p className="text-sm text-muted-foreground">
                  Place material on hold pending resolution
                </p>
              </div>
              <Switch
                checked={quality.qualityHold.enabled}
                onCheckedChange={(v) => updateHold({ enabled: v })}
              />
            </div>

            {quality.qualityHold.enabled && (
              <div className="pl-4 space-y-3 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Auto-hold material when NCR created</Label>
                  <Switch
                    checked={quality.qualityHold.autoHoldOnNCR}
                    onCheckedChange={(v) => updateHold({ autoHoldOnNCR: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Require approval to release hold</Label>
                  <Switch
                    checked={quality.qualityHold.requireApprovalToRelease}
                    onCheckedChange={(v) => updateHold({ requireApprovalToRelease: v })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Documentation */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Documentation Defaults</Label>
            <p className="text-sm text-muted-foreground">
              Default requirements for new items. Individual items can override.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Require Certificate of Conformance (COC)</Label>
                <Switch
                  checked={quality.requireCOC}
                  onCheckedChange={(v) => update({ requireCOC: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Require Material Test Report (MTR)</Label>
                <Switch
                  checked={quality.requireMTR}
                  onCheckedChange={(v) => update({ requireMTR: v })}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
