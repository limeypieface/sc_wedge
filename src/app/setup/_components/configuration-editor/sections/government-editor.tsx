"use client";

/**
 * GovernmentEditor
 *
 * Configuration editor for government compliance settings.
 * FAR/DFARS, ITAR, and small business goal tracking.
 */

import { Shield, Target, AlertTriangle, FileText, Globe } from "lucide-react";
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
import { GovernmentContractType } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

export function GovernmentEditor() {
  const { configuration, updateSection } = useConfiguration();

  if (!configuration) return null;

  const { government } = configuration;

  return (
    <div className="space-y-8">
      {/* Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Government Compliance Settings
            </p>
            <p className="text-xs text-amber-700 mt-1">
              These settings affect regulatory compliance. Consult with your
              contracts or compliance team before making changes.
            </p>
          </div>
        </div>
      </div>

      {/* FAR/DFARS Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">FAR/DFARS Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">FAR Compliance</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Federal Acquisition Regulation clause management
              </p>
            </div>
            <Switch
              checked={government.farCompliance.enabled}
              onCheckedChange={(v) =>
                updateSection("government", {
                  farCompliance: { ...government.farCompliance, enabled: v },
                })
              }
            />
          </div>

          {government.farCompliance.enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">DFARS Compliance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Defense FAR Supplement for DoD contracts
                  </p>
                </div>
                <Switch
                  checked={government.farCompliance.dfarsEnabled}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      farCompliance: { ...government.farCompliance, dfarsEnabled: v },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <p className="text-sm">Auto-include standard clauses</p>
                <Switch
                  checked={government.farCompliance.autoIncludeClauses}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      farCompliance: { ...government.farCompliance, autoIncludeClauses: v },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Cost Accounting Standards</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable CAS compliance tracking
                  </p>
                </div>
                <Switch
                  checked={government.farCompliance.costAccountingEnabled}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      farCompliance: {
                        ...government.farCompliance,
                        costAccountingEnabled: v,
                      },
                    })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract Type */}
      {government.farCompliance.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Contract Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the default contract type for new government POs.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(GovernmentContractType).map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    updateSection("government", {
                      farCompliance: {
                        ...government.farCompliance,
                        defaultContractType: type,
                      },
                    })
                  }
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    government.farCompliance.defaultContractType === type
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <h4 className="font-medium text-sm">
                    {getContractTypeLabel(type)}
                  </h4>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ITAR Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-base">ITAR Export Controls</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Enable ITAR Controls</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                International Traffic in Arms Regulations compliance
              </p>
            </div>
            <Switch
              checked={government.itar.enabled}
              onCheckedChange={(v) =>
                updateSection("government", {
                  itar: { ...government.itar, enabled: v },
                })
              }
            />
          </div>

          {government.itar.enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Citizenship Verification</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Require US person verification for access
                  </p>
                </div>
                <Switch
                  checked={government.itar.requireCitizenshipVerification}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      itar: { ...government.itar, requireCitizenshipVerification: v },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Domestic Suppliers Only</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Restrict ITAR items to US-based suppliers
                  </p>
                </div>
                <Switch
                  checked={government.itar.domesticSuppliersOnly}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      itar: { ...government.itar, domesticSuppliersOnly: v },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <p className="text-sm">Require ECCN classification</p>
                <Switch
                  checked={government.itar.requireECCN}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      itar: { ...government.itar, requireECCN: v },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <p className="text-sm">Auto-flag controlled items</p>
                <Switch
                  checked={government.itar.autoFlagControlledItems}
                  onCheckedChange={(v) =>
                    updateSection("government", {
                      itar: { ...government.itar, autoFlagControlledItems: v },
                    })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Small Business Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Small Business Goals</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Track Small Business Goals</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor subcontracting to small business categories
              </p>
            </div>
            <Switch
              checked={government.smallBusiness.enabled}
              onCheckedChange={(v) =>
                updateSection("government", {
                  smallBusiness: { ...government.smallBusiness, enabled: v },
                })
              }
            />
          </div>

          {government.smallBusiness.enabled && (
            <>
              <Separator />
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Overall Small Business Goal (%)</Label>
                  <Input
                    type="number"
                    value={government.smallBusiness.goalPercentage}
                    onChange={(e) =>
                      updateSection("government", {
                        smallBusiness: {
                          ...government.smallBusiness,
                          goalPercentage: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    min={0}
                    max={100}
                    className="w-32"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Category Goals</Label>
                  {government.smallBusiness.categories.map((cat, index) => (
                    <div
                      key={cat.code}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={cat.goalPercentage}
                          className="w-20 h-8 text-sm"
                          min={0}
                          max={100}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-2">
                  <p className="text-sm">Auto-suggest small business vendors</p>
                  <Switch
                    checked={government.smallBusiness.autoSuggest}
                    onCheckedChange={(v) =>
                      updateSection("government", {
                        smallBusiness: { ...government.smallBusiness, autoSuggest: v },
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract Segregation */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Contract Cost Segregation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Maintain separate cost pools for each contract
              </p>
            </div>
            <Switch
              checked={government.contractSegregation}
              onCheckedChange={(v) =>
                updateSection("government", { contractSegregation: v })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Require Contract Number</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All government POs must reference a contract
              </p>
            </div>
            <Switch
              checked={government.requireContractNumber}
              onCheckedChange={(v) =>
                updateSection("government", { requireContractNumber: v })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getContractTypeLabel(type: GovernmentContractType): string {
  switch (type) {
    case GovernmentContractType.FixedPrice:
      return "Fixed Price";
    case GovernmentContractType.CostReimbursement:
      return "Cost Reimbursement";
    case GovernmentContractType.TimeAndMaterials:
      return "Time & Materials";
    case GovernmentContractType.IDIQ:
      return "IDIQ";
  }
}
