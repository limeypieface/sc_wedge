"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Send,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  Package,
  CircleDot,
  ArrowRight,
  DollarSign,
  MessageSquare,
} from "lucide-react"
import {
  type VendorContact,
  lineItems,
  shipments,
  vendorContact as defaultVendorContact,
  detectSOIssuesForSO,
  type SOIssue,
} from "@/lib/mock-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useEmailContext, type EmailPreset } from "@/context/EmailContext"
import { validateEmail } from "@/lib/validation"
import { useFieldErrors, FieldError } from "@/hooks/use-field-errors"

interface Attachment {
  id: string
  name: string
  size: string
}

interface DetectedIssue {
  id: string
  type: string
  priority: 1 | 2 | 3
  title: string
  detail: string
}

type OrderVariant = "po" | "so"

const TERMINOLOGY = {
  po: {
    header: "Email Vendor",
    orderType: "Purchase Order",
    externalParty: "vendor",
    greeting: "Dear",
    defaultOrderNumber: "PO-0861",
  },
  so: {
    header: "Email Customer",
    orderType: "Sales Order",
    externalParty: "customer",
    greeting: "Dear",
    defaultOrderNumber: "SO-2024-00142",
  },
}

interface EmailComposeModalProps {
  isOpen: boolean
  onClose: () => void
  vendorContact: VendorContact
  poNumber: string
  preset?: EmailPreset | null
  variant?: OrderVariant
}

function detectPOIssues(): DetectedIssue[] {
  const issues: DetectedIssue[] = []

  // Quality holds - highest priority
  lineItems.forEach(item => {
    if (item.quantityInQualityHold > 0) {
      issues.push({
        id: `quality-${item.sku}`,
        type: "quality",
        priority: 1,
        title: `${item.quantityInQualityHold} unit on quality hold`,
        detail: `${item.sku} · Failed inspection`,
      })
    }
  })

  // Expected shipments without tracking
  shipments.filter(s => s.status === "expected").forEach(shipment => {
    issues.push({
      id: `expected-${shipment.id}`,
      type: "status",
      priority: 2,
      title: `Awaiting shipment ${shipment.id}`,
      detail: `Expected ${shipment.expectedDate} · No tracking`,
    })
  })

  // Items in transit
  shipments.filter(s => s.status === "in_transit").forEach(shipment => {
    issues.push({
      id: `transit-${shipment.id}`,
      type: "delivery",
      priority: 3,
      title: `${shipment.id} in transit`,
      detail: `ETA ${shipment.expectedDate}`,
    })
  })

  // Partial receipts
  lineItems.forEach(item => {
    if (item.quantityReceived > 0 && item.quantityReceived < item.quantityShipped) {
      issues.push({
        id: `partial-${item.sku}`,
        type: "quantity",
        priority: 2,
        title: `Partial receipt`,
        detail: `${item.sku} · ${item.quantityReceived}/${item.quantityShipped} received`,
      })
    }
  })

  return issues.sort((a, b) => a.priority - b.priority)
}

function detectSOIssues(soNumber: string): DetectedIssue[] {
  const soIssues = detectSOIssuesForSO(soNumber)
  const priorityMap = { critical: 1, high: 1, medium: 2, low: 3 } as const

  return soIssues.map((issue: SOIssue) => ({
    id: issue.id,
    type: issue.category,
    priority: priorityMap[issue.priority] as 1 | 2 | 3,
    title: issue.title,
    detail: issue.description,
  }))
}

function generatePresetEmail(preset: EmailPreset, vendorName: string, variant: OrderVariant): { subject: string; body: string } {
  const orderNumber = preset.poNumber || TERMINOLOGY[variant].defaultOrderNumber
  const firstName = vendorName.split(" ")[0]

  switch (preset.contextType) {
    case "ncr":
      return {
        subject: `${orderNumber} – NCR ${preset.ncrId}`,
        body: `Hi ${firstName},

We found an issue during inspection:

  Item: ${preset.sku}
  Qty affected: ${preset.qtyAffected}
  Issue: ${preset.issueDescription || preset.ncrType}

How would you like to proceed?

Thanks`,
      }

    case "shipment":
      return {
        subject: `${orderNumber} – Shipment ${preset.shipmentId}`,
        body: `Hi ${firstName},

Quick check on shipment ${preset.shipmentId} for ${orderNumber} – any updates?

Thanks`,
      }

    case "quality":
      return {
        subject: `${orderNumber} – Quality Issue`,
        body: `Hi ${firstName},

${preset.issueDescription || "We've identified a quality issue on this order."}

Let me know how you'd like to handle this.

Thanks`,
      }

    case "follow_up":
      return {
        subject: `Re: ${orderNumber}`,
        body: preset.body || `Hi ${firstName},

Following up on ${orderNumber} – any updates?

Thanks`,
      }

    case "change_order": {
      const version = preset.revisionVersion || "2.0"
      const changes = preset.changes || []
      const costDelta = preset.costDelta

      let changesText = ""
      if (changes.length > 0) {
        changesText = changes.map(c => `  • ${c.description}`).join("\n")
      }

      let costLine = ""
      if (costDelta && Math.abs(costDelta.percent) > 0.1) {
        costLine = `\nOrder total: ${costDelta.formatted} (${costDelta.percent > 0 ? "+" : ""}${costDelta.percent.toFixed(1)}%)\n`
      }

      return {
        subject: `${orderNumber} Rev ${version} – Please Acknowledge`,
        body: `Hi ${firstName},

Attached is revision ${version} of ${orderNumber}.
${changesText ? `\nChanges:\n${changesText}\n` : ""}${costLine}
Please reply confirming receipt.

Thanks`,
      }
    }

    case "rma_request": {
      const rmaTypeLabels: Record<string, string> = {
        return_replace: "replacement",
        return_credit: "credit",
        repair: "repair",
        dispose: "disposition instructions",
      }
      const resolutionType = preset.rmaType ? rmaTypeLabels[preset.rmaType] || "resolution" : "resolution"

      return {
        subject: `${orderNumber} – Return Authorization Request`,
        body: `Hi ${firstName},

We need to request a return authorization for the following item from ${orderNumber}:

  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}
  Issue: ${preset.issueDescription || "Quality issue identified during inspection"}

We are requesting ${resolutionType === "replacement" ? "a " : ""}${resolutionType} for this item.

Please provide:
  • RMA number
  • Return shipping address
  • Any special handling instructions

I've attached photos and our inspection report for your reference.

Please let me know how you'd like to proceed.

Thanks`,
      }
    }

    case "rma_shipped": {
      const rmaDisplay = preset.rmaNumber || preset.rmaId || "your RMA"

      return {
        subject: `${orderNumber} – Return Shipment Notification (${rmaDisplay})`,
        body: `Hi ${firstName},

This is to confirm that we have shipped the return for RMA ${rmaDisplay}.

  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}
  Carrier: ${preset.carrier || "See tracking details"}
  Tracking: ${preset.returnTrackingNumber || "Attached"}

The package includes:
  • RMA form with authorization number
  • Copy of original packing slip
  • Inspection documentation

Please confirm receipt when the shipment arrives. Let me know if you need any additional information.

Thanks`,
      }
    }

    case "rma_follow_up": {
      return {
        subject: `${orderNumber} – RMA Request Follow-up`,
        body: `Hi ${firstName},

I'm following up on our return authorization request for ${orderNumber}.

  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}
  Original request: ${preset.rmaId || "See previous correspondence"}

Could you please provide the RMA number and return instructions so we can proceed with the shipment?

Thanks`,
      }
    }

    case "rma_authorized": {
      const rmaDisplay = preset.rmaNumber || preset.rmaId || "your RMA"

      return {
        subject: `${orderNumber} – RMA Authorization Confirmed (${rmaDisplay})`,
        body: `Hi ${firstName},

Thank you for providing the RMA authorization.

  RMA Number: ${preset.rmaNumber || "Received"}
  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}

We will prepare the return shipment and send tracking information once it ships.

Thanks`,
      }
    }

    case "rma_received": {
      const rmaDisplay = preset.rmaNumber || preset.rmaId || "your RMA"

      return {
        subject: `${orderNumber} – Return Receipt Confirmation (${rmaDisplay})`,
        body: `Hi ${firstName},

I wanted to confirm that you received our return shipment for RMA ${rmaDisplay}.

  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}
  Tracking: ${preset.returnTrackingNumber || "See previous email"}

Could you confirm receipt and let us know the expected timeline for ${preset.rmaType === "return_replace" ? "the replacement shipment" : preset.rmaType === "return_credit" ? "the credit memo" : "resolution"}?

Thanks`,
      }
    }

    case "rma_resolved": {
      const rmaDisplay = preset.rmaNumber || preset.rmaId || "your RMA"

      return {
        subject: `${orderNumber} – RMA ${rmaDisplay} Complete`,
        body: `Hi ${firstName},

This is to confirm that RMA ${rmaDisplay} has been resolved.

  Item: ${preset.sku}${preset.itemName ? ` – ${preset.itemName}` : ""}
  Quantity: ${preset.qtyAffected || 1}
  Resolution: ${preset.rmaType === "return_replace" ? "Replacement received" : preset.rmaType === "return_credit" ? "Credit applied" : "Completed"}

Thank you for your prompt handling of this matter.

Best regards`,
      }
    }

    default:
      return {
        subject: preset.subject || `Re: ${orderNumber}`,
        body: preset.body || `Hi ${firstName},

Reaching out about ${orderNumber}.

Thanks`,
      }
  }
}

export function EmailComposeModal({
  isOpen,
  onClose,
  vendorContact,
  poNumber,
  preset,
  variant = "po",
}: EmailComposeModalProps) {
  const terms = TERMINOLOGY[variant]
  const [to, setTo] = useState(vendorContact.email)
  const [subject, setSubject] = useState(`Re: ${poNumber}`)
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<"select" | "compose">("select")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Field validation state
  const fieldErrors = useFieldErrors()

  const detectedIssues = useMemo(() => {
    return variant === "po" ? detectPOIssues() : detectSOIssues(poNumber)
  }, [variant, poNumber])

  // Handle preset content - skip issue selection if preset provided
  useEffect(() => {
    if (isOpen && preset) {
      const { subject: presetSubject, body: presetBody } = generatePresetEmail(preset, vendorContact.name, variant)
      setSubject(presetSubject)
      setBody(presetBody)
      setStep("compose")
      // Set pre-attached files if provided
      if (preset.attachments && preset.attachments.length > 0) {
        setAttachments(preset.attachments.map(a => ({
          id: a.id,
          name: a.name,
          size: a.size,
        })))
      }
    } else if (isOpen && !preset) {
      setStep("select")
    }
  }, [isOpen, preset, vendorContact.name, variant])

  const toggleIssue = (id: string) => {
    setSelectedIssues(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getIssueIcon = (type: string) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case "quality":
        return <AlertCircle className={cn(iconClass, "text-red-500")} />
      case "delivery":
        return <Package className={cn(iconClass, "text-blue-500")} />
      case "quantity":
        return <CircleDot className={cn(iconClass, "text-amber-500")} />
      case "status":
        return <Clock className={cn(iconClass, "text-muted-foreground")} />
      case "customer_complaint":
        return <MessageSquare className={cn(iconClass, "text-red-600")} />
      case "billing_dispute":
        return <DollarSign className={cn(iconClass, "text-amber-600")} />
      case "backorder":
        return <Package className={cn(iconClass, "text-amber-500")} />
      case "shipment_delay":
        return <AlertCircle className={cn(iconClass, "text-red-500")} />
      default:
        return <Clock className={cn(iconClass, "text-muted-foreground")} />
    }
  }

  const handleGenerateAndContinue = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    if (selectedIssues.size === 0) {
      // Generic follow-up
      setSubject(`Re: ${poNumber} - Follow Up`)
      setBody(`${terms.greeting} ${vendorContact.name},

I hope this email finds you well. I am writing regarding ${terms.orderType} ${poNumber}.

Could you please provide an update on the current status of this order?

Best regards`)
    } else {
      const selected = detectedIssues.filter(i => selectedIssues.has(i.id))
      const hasHighPriority = selected.some(i => i.priority === 1)

      // Smart subject
      if (hasHighPriority) {
        setSubject(`Re: ${poNumber} - Action Required`)
      } else if (selected.length === 1) {
        setSubject(`Re: ${poNumber} - ${selected[0].title}`)
      } else {
        setSubject(`Re: ${poNumber} - Status Update Request`)
      }

      // Build concise email
      let emailBody = `${terms.greeting} ${vendorContact.name},

I am writing regarding ${poNumber}. `

      if (selected.length === 1) {
        const issue = selected[0]
        switch (issue.type) {
          case "quality":
            emailBody += `We have placed ${issue.detail.split(" · ")[0]} on quality hold due to inspection failure. Please advise on the return/replacement process.`
            break
          case "status":
            emailBody += `Could you please confirm the ship date for ${issue.id.replace("expected-", "")} and provide tracking when available?`
            break
          case "delivery":
            emailBody += `Could you confirm ${issue.id.replace("transit-", "")} is on schedule for delivery?`
            break
          case "quantity":
            emailBody += `We received a partial shipment of ${issue.detail.split(" · ")[0]}. Please advise on the status of the remaining units.`
            break
          case "customer_complaint":
            emailBody += `Thank you for bringing this to our attention. ${issue.detail} We are investigating and will follow up with resolution options.`
            break
          case "billing_dispute":
            emailBody += `Regarding ${issue.title}: ${issue.detail} We are reviewing and will respond shortly.`
            break
          case "backorder":
            emailBody += `We wanted to update you on ${issue.title}. ${issue.detail} We will notify you when these items ship.`
            break
          default:
            emailBody += `${issue.detail}`
        }
      } else {
        emailBody += `I would like to address the following:\n`
        selected.forEach(issue => {
          emailBody += `\n• ${issue.title} — ${issue.detail}`
        })
        emailBody += `\n\nPlease provide an update at your earliest convenience.`
      }

      emailBody += `

Best regards`

      setBody(emailBody)
    }

    setIsGenerating(false)
    setStep("compose")
  }

  const handleBack = () => {
    setStep("select")
  }

  const handleSend = async () => {
    // Validate the email
    const result = validateEmail({
      recipient: { email: to, name: vendorContact.name },
      subject,
      body,
    })

    fieldErrors.applyValidationResult(result)

    if (!result.isValid) {
      toast.error("Please fix the errors before sending")
      return
    }

    setIsSending(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSending(false)
    toast.success("Email sent")

    // Call the onSend callback if provided (e.g., to mark revision as sent)
    preset?.onSend?.()

    handleClose()
  }

  const handleClose = () => {
    setTo(vendorContact.email)
    setSubject(`Re: ${poNumber}`)
    setBody("")
    setAttachments([])
    setSelectedIssues(new Set())
    setStep("select")
    fieldErrors.clearAll()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(0)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{terms.header}</h2>
              <p className="text-sm text-muted-foreground">
                {vendorContact.name} · {vendorContact.company}
              </p>
            </div>
            {step === "compose" && !preset && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-xs">
                ← Back
              </Button>
            )}
          </div>
        </div>

        {/* Step 1: Select Issues */}
        {step === "select" && (
          <div className="flex flex-col">
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                What would you like to discuss?
              </p>

              <div className="space-y-2">
                {detectedIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => toggleIssue(issue.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                      selectedIssues.has(issue.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedIssues.has(issue.id)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {selectedIssues.has(issue.id) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getIssueIcon(issue.type)}
                        <span className="text-sm font-medium">{issue.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{issue.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30">
              <Button
                onClick={handleGenerateAndContinue}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {selectedIssues.size > 0 ? (
                      <>
                        Continue with {selectedIssues.size} item{selectedIssues.size !== 1 ? "s" : ""}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Skip — General follow-up
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Compose */}
        {step === "compose" && (
          <div className="flex flex-col max-h-[70vh]">
            <div className="flex-1 overflow-y-auto">
              {/* To & Subject */}
              <div className="px-6 py-4 space-y-3 border-b">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-14">To</span>
                    <Input
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value)
                        fieldErrors.clearFieldError("Recipient")
                      }}
                      aria-invalid={fieldErrors.hasError("Recipient")}
                      className={cn(
                        "flex-1 border-0 p-0 h-auto text-sm focus-visible:ring-0 shadow-none",
                        fieldErrors.hasError("Recipient") && "text-destructive"
                      )}
                    />
                  </div>
                  <FieldError error={fieldErrors.getError("Recipient")} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-14">Subject</span>
                    <Input
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value)
                        fieldErrors.clearFieldError("Subject")
                      }}
                      aria-invalid={fieldErrors.hasError("Subject")}
                      className={cn(
                        "flex-1 border-0 p-0 h-auto text-sm font-medium focus-visible:ring-0 shadow-none",
                        fieldErrors.hasError("Subject") && "text-destructive"
                      )}
                    />
                  </div>
                  <FieldError error={fieldErrors.getError("Subject")} />
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <Textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value)
                    fieldErrors.clearFieldError("Message")
                  }}
                  placeholder="Write your message..."
                  aria-invalid={fieldErrors.hasError("Message")}
                  className={cn(
                    "min-h-[200px] resize-none border-0 p-0 text-sm focus-visible:ring-0 shadow-none",
                    fieldErrors.hasError("Message") && "text-destructive"
                  )}
                />
                <FieldError error={fieldErrors.getError("Message")} />
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="px-6 pb-4 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 pl-2 pr-1 py-1 bg-muted/50 rounded border border-border text-xs group"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground">{file.name}</span>
                        <span className="text-muted-foreground">{file.size}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                          className="p-0.5 text-muted-foreground/50 hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between bg-background">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    if (!body.trim()) return
                    setIsGenerating(true)
                    await new Promise(r => setTimeout(r, 800))
                    // Simple polish - just clean up formatting
                    setBody(prev => prev.replace(/\n{3,}/g, "\n\n").trim())
                    setIsGenerating(false)
                    toast.success("Polished")
                  }}
                  disabled={isGenerating || !body.trim()}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Discard
                </Button>
                <Button onClick={handleSend} disabled={isSending || !body.trim()} className="gap-2">
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Global Email Modal - connected to EmailContext
export function GlobalEmailModal() {
  const { state, closeEmailModal } = useEmailContext()

  return (
    <EmailComposeModal
      isOpen={state.isOpen}
      onClose={closeEmailModal}
      vendorContact={state.recipient}
      poNumber={state.orderNumber}
      preset={state.preset}
      variant={state.variant}
    />
  )
}
