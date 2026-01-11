"use client";

/**
 * ApprovalEditor
 *
 * Configuration editor for approval workflow settings.
 * Manages thresholds, approvers, and approval behavior.
 */

import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Users,
  DollarSign,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Separator,
} from "@/components/ui";
import { useConfiguration } from "@/lib/contexts";
import { cn } from "@/lib/utils";

export function ApprovalEditor() {
  const { configuration, updateSection } = useConfiguration();

  if (!configuration) return null;

  const { approval } = configuration;

  const handleToggleEnabled = (enabled: boolean) => {
    updateSection("approval", { enabled });
  };

  const handleAutoApproveLimitChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      updateSection("approval", { autoApproveLimit: num });
    }
  };

  const handleChangeThresholdChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateSection("approval", { changeApprovalThreshold: num });
    }
  };

  const handleEscalationChange = (value: string) => {
    const num = parseInt(value, 10);
    if (value === "" || value === "0") {
      updateSection("approval", { escalationTimeoutHours: null });
    } else if (!isNaN(num) && num > 0) {
      updateSection("approval", { escalationTimeoutHours: num });
    }
  };

  const handleNotificationToggle = (
    key: keyof typeof approval.notifications,
    value: boolean
  ) => {
    updateSection("approval", {
      notifications: { ...approval.notifications, [key]: value },
    });
  };

  return (
    <div className="space-y-8">
      {/* Master Enable */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Approval Workflow</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Require approval for purchase orders based on value thresholds
              </p>
            </div>
            <Switch
              checked={approval.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {approval.enabled && (
        <>
          {/* Auto-Approve Threshold */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Auto-Approve Limit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Purchase orders below this amount will be automatically approved.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={approval.autoApproveLimit}
                    onChange={(e) => handleAutoApproveLimitChange(e.target.value)}
                    className="pl-8 w-40"
                    min={0}
                    step={100}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  or less
                </span>
              </div>
              {approval.autoApproveLimit === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    All purchases require approval when set to $0
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Tiers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Approval Tiers</CardTitle>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define approval requirements based on purchase order value.
              </p>

              {approval.thresholds.map((tier, index) => (
                <div
                  key={tier.id}
                  className="p-4 border border-border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium">Tier {index + 1}</span>
                    </div>
                    {approval.thresholds.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">From Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          type="number"
                          value={tier.minAmount}
                          className="pl-7 h-9 text-sm"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">To Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          type="text"
                          value={tier.maxAmount === null ? "Unlimited" : tier.maxAmount}
                          className="pl-7 h-9 text-sm"
                          readOnly={tier.maxAmount === null}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Approvers</Label>
                    <div className="flex flex-wrap gap-2">
                      {tier.approvers.map((approver) => (
                        <span
                          key={approver.id}
                          className="px-2 py-1 bg-muted rounded text-xs font-medium"
                        >
                          {approver.displayName}
                        </span>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="text-xs">Approval Mode:</Label>
                    <div className="flex items-center gap-2">
                      {["sequential", "parallel", "any"].map((mode) => (
                        <button
                          key={mode}
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
              ))}
            </CardContent>
          </Card>

          {/* Change Approval */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Require re-approval for changes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Previously approved POs need new approval if modified
                  </p>
                </div>
                <Switch
                  checked={approval.requireApprovalForChanges}
                  onCheckedChange={(v) =>
                    updateSection("approval", { requireApprovalForChanges: v })
                  }
                />
              </div>

              {approval.requireApprovalForChanges && (
                <div className="space-y-2">
                  <Label className="text-xs">
                    Re-approval threshold (% change)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={approval.changeApprovalThreshold}
                      onChange={(e) => handleChangeThresholdChange(e.target.value)}
                      className="w-24"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">
                      % or more triggers re-approval
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Escalation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Escalation timeout (hours)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={approval.escalationTimeoutHours || ""}
                    onChange={(e) => handleEscalationChange(e.target.value)}
                    className="w-24"
                    min={0}
                    placeholder="None"
                  />
                  <span className="text-sm text-muted-foreground">
                    Leave empty to disable escalation
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(approval.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">
                    {key === "onSubmit" && "When submitted for approval"}
                    {key === "onApprove" && "When approved"}
                    {key === "onReject" && "When rejected"}
                    {key === "onEscalate" && "When escalated"}
                  </span>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) =>
                      handleNotificationToggle(
                        key as keyof typeof approval.notifications,
                        v
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
