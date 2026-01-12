"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Phone, Mail } from "lucide-react"

interface VendorContactModalProps {
  isOpen: boolean
  onClose: () => void
  type: "call" | "email" | null
}

export function VendorContactModal({ isOpen, onClose, type }: VendorContactModalProps) {
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const vendorInfo = {
    name: "Daniel Thomas",
    title: "Sales Manager",
    phone: "+1-278-437-1129",
    email: "daniel.thomas@flightechcontrollers.com",
    company: "FlightTech",
  }

  const handleSubmit = () => {
    console.log(`Contact logged: ${type} to ${vendorInfo.name}`)
    console.log(`Notes: ${notes}`)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setNotes("")
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "call" ? "Log Phone Call" : "Send Email"}</DialogTitle>
          <DialogDescription>Contact {vendorInfo.company} regarding PO-0861</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="font-semibold mb-2">Communication Logged</h3>
            <p className="text-sm text-muted-foreground">
              {type === "call" ? "Phone call" : "Email"} has been recorded in the activity timeline
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vendor Info */}
            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{vendorInfo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vendorInfo.title} at {vendorInfo.company}
                  </p>
                  {type === "call" ? (
                    <div className="flex items-center gap-2 text-sm pt-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${vendorInfo.phone}`} className="text-blue-600 hover:underline">
                        {vendorInfo.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm pt-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${vendorInfo.email}`} className="text-blue-600 hover:underline">
                        {vendorInfo.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {type === "call" ? "Call Notes" : "Email Notes"} (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  type === "call" ? "Document what was discussed..." : "What was the purpose of this communication?"
                }
                className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                {type === "call" ? (
                  <>
                    <Phone className="w-4 h-4" />
                    Log Call
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
