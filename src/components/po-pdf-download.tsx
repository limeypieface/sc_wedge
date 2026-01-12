"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileText } from "lucide-react"
import { POPDFDocument } from "./po-pdf-document"
import type { POHeader, LineItem, POCharge, VendorContact } from "@/lib/mock-data"
import { toast } from "sonner"

interface POPDFDownloadProps {
  poHeader: POHeader
  lineItems: LineItem[]
  charges: POCharge[]
  vendorContact: VendorContact
  version: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

export function POPDFDownload({
  poHeader,
  lineItems,
  charges,
  vendorContact,
  version,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: POPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      // Generate PDF blob
      const doc = (
        <POPDFDocument
          poHeader={poHeader}
          lineItems={lineItems}
          charges={charges}
          vendorContact={vendorContact}
          version={version}
        />
      )

      const blob = await pdf(doc).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${poHeader.poNumber}-v${version}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${poHeader.poNumber}-v${version}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {showLabel && "Generating..."}
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {showLabel && "Download PDF"}
        </>
      )}
    </Button>
  )
}

// Preview button that opens PDF in new tab (useful for debugging)
export function POPDFPreview({
  poHeader,
  lineItems,
  charges,
  vendorContact,
  version,
}: Omit<POPDFDownloadProps, "variant" | "size" | "showLabel">) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePreview = async () => {
    setIsGenerating(true)

    try {
      const doc = (
        <POPDFDocument
          poHeader={poHeader}
          lineItems={lineItems}
          charges={charges}
          vendorContact={vendorContact}
          version={version}
        />
      )

      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF preview")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handlePreview}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Preview PDF
        </>
      )}
    </Button>
  )
}
