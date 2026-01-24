"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"

// Status Pills - these are simpler and should work
import { LineStatusPill } from "@/shared/ui/purchase-orders/line-status-pill"
import { SOLineStatusPill } from "@/shared/ui/sales-orders/so-line-status-pill"
import { StatusBadge } from "@/shared/ui/status-badge"

export default function DuplicatesPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Duplicate Components Comparison</h1>
        <p className="text-muted-foreground">
          Review duplicate components side-by-side to decide which to keep.
        </p>
      </div>

      <Tabs defaultValue="status-pills" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="status-pills">Status Pills</TabsTrigger>
          <TabsTrigger value="status-selects">Status Selects</TabsTrigger>
          <TabsTrigger value="line-modals">Line Modals</TabsTrigger>
          <TabsTrigger value="other-modals">Other Modals</TabsTrigger>
        </TabsList>

        {/* STATUS PILLS TAB */}
        <TabsContent value="status-pills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PO Line Status Pill */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO Line Status Pill</CardTitle>
                  <Badge variant="outline">PO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/purchase-orders/line-status-pill.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <LineStatusPill status="open" />
                  <LineStatusPill status="partial" />
                  <LineStatusPill status="received" />
                  <LineStatusPill status="closed" />
                  <LineStatusPill status="cancelled" />
                </div>
              </CardContent>
            </Card>

            {/* SO Line Status Pill */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO Line Status Pill</CardTitle>
                  <Badge variant="outline">SO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/sales-orders/so-line-status-pill.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <SOLineStatusPill status="open" />
                  <SOLineStatusPill status="partial" />
                  <SOLineStatusPill status="shipped" />
                  <SOLineStatusPill status="closed" />
                  <SOLineStatusPill status="cancelled" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generic Status Pill */}
            <Card className="border-green-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generic Status Pill</CardTitle>
                  <Badge className="bg-green-500">Recommended</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/status-pill.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Configuration-driven, works with any status type via config object.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Requires a config object with color/label mappings</li>
                  <li>• Supports: green, amber, red, blue, gray colors</li>
                  <li>• TypeScript generic for type safety</li>
                  <li>• Can consolidate all PO/SO status pills</li>
                </ul>
              </CardContent>
            </Card>

            {/* Status Badge */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Status Badge</CardTitle>
                  <Badge variant="outline">Alternative</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/status-badge.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Variant-based badges with priority support.
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge variant="success">Complete</StatusBadge>
                  <StatusBadge variant="warning">Pending</StatusBadge>
                  <StatusBadge variant="error">Error</StatusBadge>
                  <StatusBadge variant="info">Info</StatusBadge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STATUS SELECTS TAB */}
        <TabsContent value="status-selects" className="space-y-6">
          <p className="text-muted-foreground mb-4">
            These components require specific context/props to render. Review source files directly.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PO Status Select */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO Status Select</CardTitle>
                  <Badge variant="outline">PO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/purchase-orders/po-status-select.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Uses PurchaseOrderStatus enum</li>
                  <li>• Uses SmartSelect component</li>
                  <li>• Has display-only variant</li>
                </ul>
              </CardContent>
            </Card>

            {/* SO Status Select */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO Status Select</CardTitle>
                  <Badge variant="outline">SO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/sales-orders/so-status-select.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Uses SalesOrderStatus enum</li>
                  <li>• Uses SmartSelect component</li>
                  <li>• ~95% identical structure to PO</li>
                </ul>
              </CardContent>
            </Card>

            {/* Line Status Select */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Line Status Select</CardTitle>
                  <Badge variant="outline">PO Lines</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/purchase-orders/line-status-select.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Uses LineItemStatus enum</li>
                  <li>• Uses SmartSelect component</li>
                  <li>• For PO line items only</li>
                </ul>
              </CardContent>
            </Card>

            {/* Revision Status Select */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Revision Status Select</CardTitle>
                  <Badge variant="outline">Revisions</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/revisions/revision-status-select.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Uses RevisionStatus enum</li>
                  <li>• Uses SmartSelect component</li>
                  <li>• Shared by PO and SO revisions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LINE MODALS TAB */}
        <TabsContent value="line-modals" className="space-y-6">
          <p className="text-muted-foreground mb-4">
            These modals have complex props. Review source files directly.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PO Line Item Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO Line Item Modal</CardTitle>
                  <Badge variant="outline">~650 lines</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/line-item-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Has Overview, Needs, Issues tabs</li>
                  <li>• Shows receiving status and history</li>
                  <li>• Uses PO-specific data structures</li>
                </ul>
              </CardContent>
            </Card>

            {/* SO Line Item Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO Line Item Modal</CardTitle>
                  <Badge variant="outline">~597 lines</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/so-line-item-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Has Overview, Issues tabs (no Needs)</li>
                  <li>• Shows fulfillment/shipping status</li>
                  <li>• ~95% similar code structure</li>
                </ul>
              </CardContent>
            </Card>

            {/* PO Edit Line Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO Edit Line Modal</CardTitle>
                  <Badge variant="outline">~525 lines</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/edit-line-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Edit qty, price, tax rate, charges</li>
                  <li>• Has financial approval logic</li>
                  <li>• Uses LineEditData type</li>
                </ul>
              </CardContent>
            </Card>

            {/* SO Edit Line Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO Edit Line Modal</CardTitle>
                  <Badge variant="outline">~480 lines</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/so-edit-line-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Edit qty, price, tax code, charges</li>
                  <li>• Simpler change tracking</li>
                  <li>• ~90% similar to PO version</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OTHER MODALS TAB */}
        <TabsContent value="other-modals" className="space-y-6">
          <p className="text-muted-foreground mb-4">
            These modals have complex props. Review source files directly.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PO Edit Header Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO Edit Header Modal</CardTitle>
                  <Badge variant="outline">PO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/edit-header-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Edit shipping, terms, charges</li>
                  <li>• Has financial approval checks</li>
                  <li>• Uses HeaderEditData type</li>
                </ul>
              </CardContent>
            </Card>

            {/* SO Edit Header Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO Edit Header Modal</CardTitle>
                  <Badge variant="outline">SO-specific</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/so-edit-header-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Edit shipping, terms, charges</li>
                  <li>• ~95% identical structure to PO</li>
                  <li>• Uses SOHeaderEditData type</li>
                </ul>
              </CardContent>
            </Card>

            {/* PO VOIP Modal */}
            <Card className="border-green-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">PO VOIP Call Modal</CardTitle>
                  <Badge className="bg-green-500">Has variant prop</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/voip-call-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Call vendor contacts</li>
                  <li>• Has OrderVariant prop for PO/SO switching</li>
                  <li>• More generic/reusable</li>
                </ul>
              </CardContent>
            </Card>

            {/* SO VOIP Modal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SO VOIP Call Modal</CardTitle>
                  <Badge variant="destructive">Hardcoded</Badge>
                </div>
                <CardDescription className="font-mono text-xs">
                  /src/shared/ui/modals/so-voip-call-modal.tsx
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-1">
                  <li>• Call customer contacts</li>
                  <li>• Hardcoded &ldquo;customer&rdquo; references</li>
                  <li>• Should use PO version with variant</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      {/* Summary Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Consolidation Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Easy Wins</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                <li>• Line Status Pills → Use generic StatusPill</li>
                <li>• SO VOIP Modal → Use PO version with variant</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">Medium Effort</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                <li>• Status Selects → Create generic StatusSelect</li>
                <li>• Edit Header Modals → Parameterize with config</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Higher Effort</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1">
                <li>• Line Item Modals → Abstract tabs/content</li>
                <li>• Edit Line Modals → Unify data structures</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
