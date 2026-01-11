"use client";

/**
 * VendorEditor
 *
 * Configuration editor for vendor management settings.
 */

import { Package, BarChart3, FileCheck, Shield } from "lucide-react";
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

export function VendorEditor() {
  const { configuration, updateSection } = useConfiguration();

  if (!configuration) return null;

  const { vendor } = configuration;

  return (
    <div className="space-y-8">
      {/* Approved Vendor List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Approved Vendor List</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Require Approved Vendors</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only allow purchases from pre-approved vendors
              </p>
            </div>
            <Switch
              checked={vendor.requireApprovedVendor}
              onCheckedChange={(v) =>
                updateSection("vendor", { requireApprovedVendor: v })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Vendor Qualification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Require qualification process before approval
              </p>
            </div>
            <Switch
              checked={vendor.qualificationEnabled}
              onCheckedChange={(v) =>
                updateSection("vendor", { qualificationEnabled: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Performance Tracking</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Vendor Scorecarding</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track and score vendor performance over time
              </p>
            </div>
            <Switch
              checked={vendor.scorecardEnabled}
              onCheckedChange={(v) =>
                updateSection("vendor", { scorecardEnabled: v })
              }
            />
          </div>

          {vendor.scorecardEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs">Performance Metrics</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">On-Time Delivery</p>
                    <Switch
                      checked={vendor.performanceMetrics.onTimeDelivery}
                      onCheckedChange={(v) =>
                        updateSection("vendor", {
                          performanceMetrics: {
                            ...vendor.performanceMetrics,
                            onTimeDelivery: v,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Quality Score</p>
                    <Switch
                      checked={vendor.performanceMetrics.qualityScore}
                      onCheckedChange={(v) =>
                        updateSection("vendor", {
                          performanceMetrics: {
                            ...vendor.performanceMetrics,
                            qualityScore: v,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Price Competitiveness</p>
                    <Switch
                      checked={vendor.performanceMetrics.priceCompetitiveness}
                      onCheckedChange={(v) =>
                        updateSection("vendor", {
                          performanceMetrics: {
                            ...vendor.performanceMetrics,
                            priceCompetitiveness: v,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm">Responsiveness</p>
                    <Switch
                      checked={vendor.performanceMetrics.responsiveness}
                      onCheckedChange={(v) =>
                        updateSection("vendor", {
                          performanceMetrics: {
                            ...vendor.performanceMetrics,
                            responsiveness: v,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Auto-Disqualify Threshold</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={vendor.autoDisqualifyThreshold || ""}
                    onChange={(e) =>
                      updateSection("vendor", {
                        autoDisqualifyThreshold: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    min={0}
                    max={100}
                    placeholder="None"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Score below this triggers review (leave empty to disable)
                  </span>
                </div>
              </div>
            </>
          )}
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
              <p className="text-sm font-medium">Require Insurance Certificate</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vendors must provide proof of insurance
              </p>
            </div>
            <Switch
              checked={vendor.requireInsurance}
              onCheckedChange={(v) =>
                updateSection("vendor", { requireInsurance: v })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Require Tax Documents</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Collect W-9 or equivalent tax documentation
              </p>
            </div>
            <Switch
              checked={vendor.requireTaxDocuments}
              onCheckedChange={(v) =>
                updateSection("vendor", { requireTaxDocuments: v })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
