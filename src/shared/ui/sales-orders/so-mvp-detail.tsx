// @ts-nocheck
"use client"

/**
 * SOMVPDetail - Simplified Sales Order MVP View
 *
 * A streamlined SO view similar to PO's MVPContent:
 * - Order Details card with edit capability
 * - Line Items table with display modes
 * - Fees & Clauses sections
 * - Financial summary
 * - Attachments
 * - Acknowledgment tracking
 */

import { useState, useRef } from "react"
import { Edit, Download, ChevronDown, Upload, Trash2, Plus, Eye, FileText, GripVertical, CalendarIcon, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import { SOLineStatusPill } from "@/components/so-line-status-pill"
import { getPOData, computePOTotals, type LineItem, type POCharge } from "@/lib/mock-data"

// ============================================================================
// TYPES
// ============================================================================

interface SOMVPDetailProps {
  soNumber: string
}

interface MVPAttachment {
  id: string
  name: string
  size: number
  uploadedAt: string
  uploadedBy: string
  url?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SOMVPDetail({ soNumber }: SOMVPDetailProps) {
  // Get SO data (reusing PO mock data structure)
  const soData = getPOData(soNumber) || getPOData("SO-2024-00142")
  const soHeader = soData?.header
  const customerContact = soData?.vendorContact

  if (!soHeader) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Sales Order Not Found</h1>
        <p className="text-muted-foreground">Could not find SO: {soNumber}</p>
        <Link href="/sales/sales-orders" className="text-primary underline mt-4 inline-block">
          Back to Sales Orders
        </Link>
      </div>
    )
  }

  // State
  const [lines, setLines] = useState<LineItem[]>(soData.lineItems)
  const [charges] = useState<POCharge[]>(soData.charges || [])
  const [lineDisplayMode, setLineDisplayMode] = useState<'basic' | 'quantity' | 'financial'>('basic')
  const [attachments, setAttachments] = useState<MVPAttachment[]>([])
  const [clauses, setClauses] = useState<string[]>([])
  const [isAddClauseOpen, setIsAddClauseOpen] = useState(false)
  const [newClause, setNewClause] = useState('')
  const [draggedClauseIndex, setDraggedClauseIndex] = useState<number | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Header edit state
  const [isHeaderEditOpen, setIsHeaderEditOpen] = useState(false)
  const [headerShippingMethod, setHeaderShippingMethod] = useState(soHeader.shipping?.method || '')
  const [headerPaymentTerms, setHeaderPaymentTerms] = useState(soHeader.payment?.terms || '')
  const [headerPromisedDate, setHeaderPromisedDate] = useState<Date | undefined>(
    soHeader.dates?.promised ? new Date(soHeader.dates.promised) : undefined
  )

  // Calculate totals
  const soTotals = computePOTotals(lines, charges)

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newAttachments: MVPAttachment[] = Array.from(files).map((file, idx) => ({
      id: `att-new-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  // Remove attachment
  const removeFile = (id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id))
  }

  // Clause handlers
  const handleAddClause = () => {
    if (newClause.trim()) {
      setClauses(prev => [...prev, newClause.trim()])
      setNewClause('')
      setIsAddClauseOpen(false)
    }
  }

  const handleClauseDragStart = (index: number) => {
    setDraggedClauseIndex(index)
  }

  const handleClauseDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedClauseIndex === null || draggedClauseIndex === index) return
    const newClauses = [...clauses]
    const draggedClause = newClauses[draggedClauseIndex]
    newClauses.splice(draggedClauseIndex, 1)
    newClauses.splice(index, 0, draggedClause)
    setClauses(newClauses)
    setDraggedClauseIndex(index)
  }

  const handleClauseDragEnd = () => {
    setDraggedClauseIndex(null)
  }

  // Acknowledgment handler
  const handleAcknowledgmentChange = (checked: boolean) => {
    setAcknowledged(checked)
    if (checked) {
      setAcknowledgedAt(new Date().toISOString())
    } else {
      setAcknowledgedAt(undefined)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-muted/30 border-b shrink-0 z-10">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/sales/sales-orders" className="hover:text-foreground">Sales Orders</Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{soNumber}</span>
              <Badge variant="outline" className="ml-3">MVP</Badge>
            </div>
            <Link href={`/so/${soNumber}`}>
              <Button variant="outline" size="sm">
                Switch to Full View
              </Button>
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Sales Order {soNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {soHeader.supplier?.name || soHeader.vendorName} • Created {soHeader.dates?.created || soHeader.createdDate}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-5xl">
          {/* Order Details Card */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Order Details</h3>
                <Button variant="outline" size="sm" onClick={() => setIsHeaderEditOpen(!isHeaderEditOpen)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <p className="text-sm font-medium mt-1">{soHeader.supplier?.name || soHeader.vendorName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sales Rep</Label>
                  <p className="text-sm mt-1">{soHeader.buyer || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created Date</Label>
                  <p className="text-sm mt-1">{soHeader.dates?.created || soHeader.createdDate || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Promised Date</Label>
                  <p className="text-sm mt-1">
                    {headerPromisedDate ? formatDateForDisplay(headerPromisedDate) : (soHeader.dates?.promised || '—')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                  <p className="text-sm mt-1">{headerPaymentTerms || soHeader.payment?.terms || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Shipping Method</Label>
                  <p className="text-sm mt-1">{headerShippingMethod || soHeader.shipping?.method || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <p className="text-sm mt-1">{soHeader.currency || 'USD'}</p>
                </div>
              </div>

              {/* Customer Acknowledgment */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="mvp-acknowledged"
                    checked={acknowledged}
                    onCheckedChange={handleAcknowledgmentChange}
                  />
                  <label htmlFor="mvp-acknowledged" className="text-sm cursor-pointer font-medium">
                    Customer Confirmed
                  </label>
                  {acknowledged && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {acknowledgedAt ? formatDate(acknowledgedAt) : 'Set date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={acknowledgedAt ? new Date(acknowledgedAt) : undefined}
                          onSelect={(date) => setAcknowledgedAt(date?.toISOString())}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Line Items ({lines.length})</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">View:</span>
                  <ToggleGroup
                    type="single"
                    value={lineDisplayMode}
                    onValueChange={(v) => v && setLineDisplayMode(v as 'basic' | 'quantity' | 'financial')}
                    className="bg-muted/50 rounded-md p-0.5"
                  >
                    <ToggleGroupItem value="basic" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                      Basic
                    </ToggleGroupItem>
                    <ToggleGroupItem value="quantity" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                      Quantity
                    </ToggleGroupItem>
                    <ToggleGroupItem value="financial" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                      Financial
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="w-24">SKU</TableHead>
                      <TableHead className="min-w-[180px]">Description</TableHead>
                      {lineDisplayMode === 'basic' && (
                        <>
                          <TableHead className="w-20 text-right">Qty</TableHead>
                          <TableHead className="w-24 text-right">Unit Price</TableHead>
                          <TableHead className="w-28 text-right">Total</TableHead>
                        </>
                      )}
                      {lineDisplayMode === 'quantity' && (
                        <>
                          <TableHead className="w-20 text-right">Ordered</TableHead>
                          <TableHead className="w-20 text-right">Shipped</TableHead>
                          <TableHead className="w-20 text-right">Delivered</TableHead>
                          <TableHead className="w-20 text-right">Remaining</TableHead>
                        </>
                      )}
                      {lineDisplayMode === 'financial' && (
                        <>
                          <TableHead className="w-24 text-right">Unit Price</TableHead>
                          <TableHead className="w-28 text-right">Line Total</TableHead>
                          <TableHead className="w-20 text-right">Tax Rate</TableHead>
                          <TableHead className="w-24 text-right">Tax</TableHead>
                          <TableHead className="w-28 text-right">With Tax</TableHead>
                        </>
                      )}
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id} className="group">
                        <TableCell className="font-medium">{line.lineNumber}</TableCell>
                        <TableCell>
                          <SOLineStatusPill status={line.status || 'pending'} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{line.sku}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={line.name}>{line.name}</TableCell>
                        {lineDisplayMode === 'basic' && (
                          <>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(line.lineTotal)}</TableCell>
                          </>
                        )}
                        {lineDisplayMode === 'quantity' && (
                          <>
                            <TableCell className="text-right">{line.quantityOrdered || line.quantity}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{line.quantityShipped || 0}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{line.quantityReceived || 0}</TableCell>
                            <TableCell className="text-right">
                              {(line.quantityOrdered || line.quantity) - (line.quantityShipped || 0)}
                            </TableCell>
                          </>
                        )}
                        {lineDisplayMode === 'financial' && (
                          <>
                            <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(line.lineTotal)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {line.taxRate ? `${(line.taxRate * 100).toFixed(2)}%` : '8.25%'}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(line.taxAmount || 0)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(line.lineTotalWithTax || line.lineTotal)}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>

          {/* Fees & Clauses */}
          {(clauses.length === 0) ? (
            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddClauseOpen(true)}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Clause
              </Button>
            </div>
          ) : (
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Terms & Clauses</h4>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddClauseOpen(true)} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-1">
                  {clauses.map((clause, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleClauseDragStart(index)}
                      onDragOver={(e) => handleClauseDragOver(e, index)}
                      onDragEnd={handleClauseDragEnd}
                      className={cn(
                        "flex items-start gap-2 group py-1.5 px-2 rounded transition-colors cursor-move",
                        draggedClauseIndex === index ? "bg-muted/50 opacity-50" : "hover:bg-muted/30"
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium w-5 shrink-0">{index + 1}.</span>
                      <span className="text-sm flex-1 whitespace-pre-wrap">{clause}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setClauses(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Financials */}
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-4">Financials</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(soTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(soTotals.taxRate * 100).toFixed(2)}%)</span>
                  <span>{formatCurrency(soTotals.totalTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(soTotals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Attachments */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Attachments</h3>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    multiple
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Clause Modal */}
      {isAddClauseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddClauseOpen(false)} />
          <Card className="relative z-50 w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add Clause</h2>
              <Textarea
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                placeholder="Enter clause text..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddClauseOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddClause}>
                  Add Clause
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
