"use client";

/**
 * QualityEditor
 *
 * Configuration editor for quality inspection and receiving settings.
 * Combines quality and receiving configurations.
 */

import {
  Shield,
  Package,
  FileCheck,
  AlertTriangle,
  Hash,
  Percent,
} from "lucide-react";
import {
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
import { InspectionLevel } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

export function QualityEditor() {
  const { configuration, updateSection } = useConfiguration();

  if (!configuration) return null;

  const { quality, receiving } = configuration;

  const handleQualityToggle = (enabled: boolean) => {
    updateSection("quality", { enabled });
  };

  const handleInspectionLevelChange = (level: InspectionLevel) => {
    updateSection("quality", { defaultInspectionLevel: level });
  };

  return (
    <div className="space-y-8">
      {/* Quality Inspection Master Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Quality Inspection</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Inspect incoming materials before releasing to inventory
                </p>
              </div>
            </div>
            <Switch
              checked={quality.enabled}
              onCheckedChange={handleQualityToggle}
            />
          </div>
        </CardContent>
      </Card>

      {quality.enabled && (
        <>
          {/* Inspection Level */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Inspection Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose the default inspection level for incoming materials.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(InspectionLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleInspectionLevelChange(level)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      quality.defaultInspectionLevel === level
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <h4 className="font-medium text-sm capitalize">{level}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getInspectionDescription(level)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentation Requirements */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Documentation Requirements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Certificate of Conformance (COC)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Require supplier certification that materials meet specifications
                  </p>
                </div>
                <Switch
                  checked={quality.requireCOC}
                  onCheckedChange={(v) => updateSection("quality", { requireCOC: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Material Test Report (MTR)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Require test results for material properties
                  </p>
                </div>
                <Switch
                  checked={quality.requireMTR}
                  onCheckedChange={(v) => updateSection("quality", { requireMTR: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* NCR Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-base">Non-Conformance Reports (NCR)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Enable NCR Tracking</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track quality issues and non-conforming materials
                  </p>
                </div>
                <Switch
                  checked={quality.ncr.enabled}
                  onCheckedChange={(v) =>
                    updateSection("quality", { ncr: { ...quality.ncr, enabled: v } })
                  }
                />
              </div>

              {quality.ncr.enabled && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Auto-create NCR on inspection failure</p>
                    <Switch
                      checked={quality.ncr.autoCreateOnFailure}
                      onCheckedChange={(v) =>
                        updateSection("quality", {
                          ncr: { ...quality.ncr, autoCreateOnFailure: v },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Require disposition before closing</p>
                    <Switch
                      checked={quality.ncr.requireDisposition}
                      onCheckedChange={(v) =>
                        updateSection("quality", {
                          ncr: { ...quality.ncr, requireDisposition: v },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Notify supplier on NCR creation</p>
                    <Switch
                      checked={quality.ncr.notifySupplier}
                      onCheckedChange={(v) =>
                        updateSection("quality", {
                          ncr: { ...quality.ncr, notifySupplier: v },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quality Hold */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Hold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Enable Quality Holds</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Place materials on hold pending quality resolution
                  </p>
                </div>
                <Switch
                  checked={quality.qualityHold.enabled}
                  onCheckedChange={(v) =>
                    updateSection("quality", {
                      qualityHold: { ...quality.qualityHold, enabled: v },
                    })
                  }
                />
              </div>

              {quality.qualityHold.enabled && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Auto-hold on NCR creation</p>
                    <Switch
                      checked={quality.qualityHold.autoHoldOnNCR}
                      onCheckedChange={(v) =>
                        updateSection("quality", {
                          qualityHold: { ...quality.qualityHold, autoHoldOnNCR: v },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Require approval to release hold</p>
                    <Switch
                      checked={quality.qualityHold.requireApprovalToRelease}
                      onCheckedChange={(v) =>
                        updateSection("quality", {
                          qualityHold: {
                            ...quality.qualityHold,
                            requireApprovalToRelease: v,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Receiving Settings */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-primary" />
          Receiving Settings
        </h2>

        {/* Three-Way Matching */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Three-Way Matching</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Match PO, receipt, and invoice before payment
                </p>
              </div>
              <Switch
                checked={receiving.threeWayMatchEnabled}
                onCheckedChange={(v) =>
                  updateSection("receiving", { threeWayMatchEnabled: v })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Tolerances */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Variance Tolerances</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Quantity Tolerance (%)</Label>
                <Input
                  type="number"
                  value={receiving.quantityTolerance}
                  onChange={(e) =>
                    updateSection("receiving", {
                      quantityTolerance: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price Tolerance (%)</Label>
                <Input
                  type="number"
                  value={receiving.priceTolerance}
                  onChange={(e) =>
                    updateSection("receiving", {
                      priceTolerance: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Over-Receiving */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Allow Over-Receiving</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept more than ordered quantity
                </p>
              </div>
              <Switch
                checked={receiving.allowOverReceive}
                onCheckedChange={(v) =>
                  updateSection("receiving", { allowOverReceive: v })
                }
              />
            </div>

            {receiving.allowOverReceive && (
              <div className="space-y-2">
                <Label className="text-xs">Max Over-Receive (%)</Label>
                <Input
                  type="number"
                  value={receiving.maxOverReceivePercent}
                  onChange={(e) =>
                    updateSection("receiving", {
                      maxOverReceivePercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                  className="w-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Tracking</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Lot Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track materials by supplier lot number
                </p>
              </div>
              <Switch
                checked={receiving.lotTrackingEnabled}
                onCheckedChange={(v) =>
                  updateSection("receiving", { lotTrackingEnabled: v })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Serial Number Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track individual items by serial number
                </p>
              </div>
              <Switch
                checked={receiving.serialTrackingEnabled}
                onCheckedChange={(v) =>
                  updateSection("receiving", { serialTrackingEnabled: v })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Other Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <p className="text-sm">Require packing slip</p>
              <Switch
                checked={receiving.requirePackingSlip}
                onCheckedChange={(v) =>
                  updateSection("receiving", { requirePackingSlip: v })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <p className="text-sm">Auto-close lines when fully received</p>
              <Switch
                checked={receiving.autoCloseOnFullReceipt}
                onCheckedChange={(v) =>
                  updateSection("receiving", { autoCloseOnFullReceipt: v })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getInspectionDescription(level: InspectionLevel): string {
  switch (level) {
    case InspectionLevel.None:
      return "No inspection required, trust supplier quality";
    case InspectionLevel.Sample:
      return "Statistical sampling of incoming materials";
    case InspectionLevel.Full:
      return "100% inspection of all materials";
    case InspectionLevel.Certified:
      return "Reduced inspection for certified suppliers";
  }
}
