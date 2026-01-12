"use client";

/**
 * ApprovalSettings
 *
 * Settings panel for approval workflow configuration.
 * Inline editing with immediate save.
 */

import { useState } from "react";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PurchasingConfiguration, ApprovalThreshold, ApproverDefinition } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

interface ApprovalSettingsProps {
  config: PurchasingConfiguration;
  onChange: (updates: Partial<PurchasingConfiguration>) => void;
}

const AVAILABLE_APPROVERS: ApproverDefinition[] = [
  { id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true },
  { id: "fin", type: "role", value: "finance", displayName: "Finance", canDelegate: false },
  { id: "exec", type: "role", value: "executive", displayName: "Executive", canDelegate: false },
  { id: "proc", type: "role", value: "procurement_lead", displayName: "Procurement Lead", canDelegate: true },
  { id: "dept", type: "role", value: "department_head", displayName: "Department Head", canDelegate: true },
];

export function ApprovalSettings({ config, onChange }: ApprovalSettingsProps) {
  const { approval } = config;
  const [showApproverPicker, setShowApproverPicker] = useState<string | null>(null);

  const updateApproval = (updates: Partial<typeof approval>) => {
    onChange({ approval: { ...approval, ...updates } });
  };

  const updateThreshold = (tierId: string, updates: Partial<ApprovalThreshold>) => {
    const thresholds = approval.thresholds.map((t) =>
      t.id === tierId ? { ...t, ...updates } : t
    );
    // Recalculate minAmounts
    for (let i = 1; i < thresholds.length; i++) {
      const prevMax = thresholds[i - 1].maxAmount;
      if (prevMax !== null) {
        thresholds[i] = { ...thresholds[i], minAmount: prevMax };
      }
    }
    updateApproval({ thresholds });
  };

  const addTier = () => {
    const lastTier = approval.thresholds[approval.thresholds.length - 1];
    let thresholds = [...approval.thresholds];

    if (lastTier && lastTier.maxAmount === null) {
      thresholds[thresholds.length - 1] = {
        ...lastTier,
        maxAmount: lastTier.minAmount + 10000,
      };
    }

    const newTier: ApprovalThreshold = {
      id: `tier-${Date.now()}`,
      minAmount: thresholds[thresholds.length - 1]?.maxAmount || approval.autoApproveLimit,
      maxAmount: null,
      approvers: [AVAILABLE_APPROVERS[0]],
      approvalMode: "sequential",
    };

    updateApproval({ thresholds: [...thresholds, newTier] });
  };

  const removeTier = (tierId: string) => {
    if (approval.thresholds.length <= 1) return;
    let thresholds = approval.thresholds.filter((t) => t.id !== tierId);
    thresholds[thresholds.length - 1] = {
      ...thresholds[thresholds.length - 1],
      maxAmount: null,
    };
    updateApproval({ thresholds });
  };

  const addApprover = (tierId: string, approver: ApproverDefinition) => {
    const thresholds = approval.thresholds.map((t) => {
      if (t.id !== tierId) return t;
      if (t.approvers.some((a) => a.id === approver.id)) return t;
      return { ...t, approvers: [...t.approvers, approver] };
    });
    updateApproval({ thresholds });
    setShowApproverPicker(null);
  };

  const removeApprover = (tierId: string, approverId: string) => {
    const thresholds = approval.thresholds.map((t) => {
      if (t.id !== tierId || t.approvers.length <= 1) return t;
      return { ...t, approvers: t.approvers.filter((a) => a.id !== approverId) };
    });
    updateApproval({ thresholds });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Approval Workflow</h2>
        <p className="text-muted-foreground mt-1">
          Configure how purchase orders are approved based on value.
        </p>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div>
          <p className="font-medium">Enable Approval Workflow</p>
          <p className="text-sm text-muted-foreground">
            Require approval for purchase orders
          </p>
        </div>
        <Switch
          checked={approval.enabled}
          onCheckedChange={(enabled) => updateApproval({ enabled })}
        />
      </div>

      {approval.enabled && (
        <>
          <Separator />

          {/* Auto-Approve Limit */}
          <div className="space-y-3">
            <Label>Auto-Approve Limit</Label>
            <p className="text-sm text-muted-foreground">
              Purchases below this amount are automatically approved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={approval.autoApproveLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const thresholds = approval.thresholds.map((t, i) =>
                    i === 0 ? { ...t, minAmount: val } : t
                  );
                  updateApproval({ autoApproveLimit: val, thresholds });
                }}
                className="w-32"
                min={0}
                step={100}
              />
            </div>
          </div>

          <Separator />

          {/* Approval Tiers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Approval Tiers</Label>
                <p className="text-sm text-muted-foreground">
                  Define who approves at each spending level.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addTier}>
                <Plus className="w-4 h-4 mr-1" />
                Add Tier
              </Button>
            </div>

            <div className="space-y-3">
              {approval.thresholds.map((tier, index) => {
                const isLast = index === approval.thresholds.length - 1;
                const availableToAdd = AVAILABLE_APPROVERS.filter(
                  (a) => !tier.approvers.some((existing) => existing.id === a.id)
                );

                return (
                  <div
                    key={tier.id}
                    className="p-4 rounded-lg border border-border space-y-4"
                  >
                    {/* Tier header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatCurrency(tier.minAmount)} — {isLast ? "Unlimited" : formatCurrency(tier.maxAmount!)}
                      </span>
                      {approval.thresholds.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => removeTier(tier.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Max amount (if not last) */}
                    {!isLast && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-20">Up to</Label>
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={tier.maxAmount || ""}
                          onChange={(e) =>
                            updateThreshold(tier.id, {
                              maxAmount: parseInt(e.target.value) || null,
                            })
                          }
                          className="w-28 h-8"
                          min={tier.minAmount + 1}
                          step={1000}
                        />
                      </div>
                    )}

                    {/* Approvers */}
                    <div className="space-y-2">
                      <Label className="text-xs">Approvers</Label>
                      <div className="flex flex-wrap gap-2">
                        {tier.approvers.map((approver) => (
                          <span
                            key={approver.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-medium"
                          >
                            {approver.displayName}
                            {tier.approvers.length > 1 && (
                              <button
                                onClick={() => removeApprover(tier.id, approver.id)}
                                className="opacity-50 hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() =>
                              setShowApproverPicker(showApproverPicker === tier.id ? null : tier.id)
                            }
                            disabled={availableToAdd.length === 0}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                          {showApproverPicker === tier.id && availableToAdd.length > 0 && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10">
                              {availableToAdd.map((approver) => (
                                <button
                                  key={approver.id}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => addApprover(tier.id, approver)}
                                >
                                  {approver.displayName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Approval Mode */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">Mode</Label>
                      <div className="flex gap-1">
                        {(["sequential", "parallel", "any"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => updateThreshold(tier.id, { approvalMode: mode })}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-colors",
                              tier.approvalMode === mode
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Change Approval */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Re-approval for Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Require new approval when PO is modified
                </p>
              </div>
              <Switch
                checked={approval.requireApprovalForChanges}
                onCheckedChange={(v) => updateApproval({ requireApprovalForChanges: v })}
              />
            </div>

            {approval.requireApprovalForChanges && (
              <div className="flex items-center gap-2 pl-4">
                <Label className="text-sm">Threshold:</Label>
                <Input
                  type="number"
                  value={approval.changeApprovalThreshold}
                  onChange={(e) =>
                    updateApproval({ changeApprovalThreshold: parseInt(e.target.value) || 0 })
                  }
                  className="w-20 h-8"
                  min={0}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">% change triggers re-approval</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Escalation */}
          <div className="space-y-3">
            <Label>Escalation Timeout</Label>
            <p className="text-sm text-muted-foreground">
              Escalate if not approved within this time. Leave empty to disable.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={approval.escalationTimeoutHours || ""}
                onChange={(e) =>
                  updateApproval({
                    escalationTimeoutHours: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-24"
                min={0}
                placeholder="None"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
