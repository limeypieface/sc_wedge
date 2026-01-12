"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { POHeader, LineItem, POCharge, VendorContact } from "@/lib/mock-data"

// Standard PO Terms and Conditions
export const PO_TERMS_AND_CONDITIONS = [
  {
    id: "1",
    title: "ACCEPTANCE",
    text: "This Purchase Order constitutes an offer to purchase and shall become a binding contract upon Seller's written acceptance, acknowledgment, commencement of performance, or shipment of goods, whichever occurs first. Any acceptance containing terms additional to or different from those stated herein is expressly rejected unless specifically agreed to in writing by Buyer.",
  },
  {
    id: "2",
    title: "DELIVERY",
    text: "Time is of the essence. Seller shall deliver goods on or before the delivery date specified for each line item. Buyer reserves the right to cancel all or any part of this order if delivery is not made within the time specified. Seller shall notify Buyer immediately of any anticipated delay.",
  },
  {
    id: "3",
    title: "SHIPPING & RISK OF LOSS",
    text: "Unless otherwise specified, all shipments shall be FOB Destination. Risk of loss shall remain with Seller until goods are delivered to the specified destination and accepted by Buyer. Seller shall pack all goods in accordance with good commercial practice and in compliance with all applicable regulations.",
  },
  {
    id: "4",
    title: "INSPECTION & ACCEPTANCE",
    text: "All goods are subject to inspection and approval by Buyer at destination within a reasonable time after delivery. Payment shall not constitute acceptance. Buyer reserves the right to reject any goods that fail to conform to specifications, drawings, samples, or other requirements. Rejected goods shall be held at Seller's risk and expense.",
  },
  {
    id: "5",
    title: "WARRANTY",
    text: "Seller warrants that all goods furnished hereunder shall: (a) be new and of merchantable quality; (b) be free from defects in material, workmanship, and design; (c) conform to applicable specifications, drawings, and samples; (d) be fit for their intended purpose; and (e) comply with all applicable laws and regulations. This warranty shall survive inspection, acceptance, and payment, and shall extend for a period of twelve (12) months from date of delivery or such longer period as may be specified.",
  },
  {
    id: "6",
    title: "INVOICING & PAYMENT",
    text: "Invoices must reference this Purchase Order number, line item numbers, and include itemized pricing consistent with this order. Payment terms shall commence upon the later of: (a) receipt of a correct invoice, or (b) receipt and acceptance of conforming goods. Buyer may withhold payment for any goods that fail to conform to requirements pending resolution.",
  },
  {
    id: "7",
    title: "CHANGES",
    text: "Buyer may at any time make changes to drawings, specifications, quantities, delivery schedules, or shipping instructions. If any such change affects the cost or time of performance, an equitable adjustment shall be negotiated. No change to this Purchase Order shall be binding unless made in writing and signed by Buyer's authorized representative.",
  },
  {
    id: "8",
    title: "COMPLIANCE WITH LAWS",
    text: "Seller shall comply with all applicable federal, state, and local laws, rules, regulations, and ordinances in the performance of this order, including without limitation those relating to labor, health, safety, and environmental protection. Seller shall maintain all licenses and permits required for performance.",
  },
  {
    id: "9",
    title: "INDEMNIFICATION",
    text: "Seller shall indemnify, defend, and hold harmless Buyer from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from or related to: (a) any breach of this order by Seller; (b) any defect in goods furnished; or (c) any negligent or wrongful act or omission of Seller.",
  },
  {
    id: "10",
    title: "CONFIDENTIALITY",
    text: "Seller agrees to keep confidential all information, specifications, drawings, and data furnished by Buyer or developed in connection with this order. Such information shall not be disclosed to third parties or used for any purpose other than performance of this order without Buyer's prior written consent.",
  },
  {
    id: "11",
    title: "TERMINATION",
    text: "Buyer may terminate this order in whole or in part at any time for convenience upon written notice to Seller. Upon such termination, Buyer's liability shall be limited to payment for conforming goods delivered and accepted prior to termination, plus reasonable termination charges for work in progress.",
  },
  {
    id: "12",
    title: "GOVERNING LAW",
    text: "This Purchase Order shall be governed by and construed in accordance with the laws of the state specified in Buyer's address, without regard to conflict of laws principles. Any dispute arising hereunder shall be resolved in the courts of such state.",
  },
]

// PDF Styles - Black and white contract style
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
    lineHeight: 1.4,
  },
  // Document Header
  documentHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 15,
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    width: "50%",
  },
  headerRight: {
    width: "50%",
    textAlign: "right",
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2,
  },
  poNumber: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // Sections
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 3,
    marginBottom: 8,
  },
  // Two column layout
  twoColumn: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  // Field rows
  fieldRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  fieldLabel: {
    width: 100,
    fontWeight: "bold",
    fontSize: 8,
  },
  fieldValue: {
    flex: 1,
    fontSize: 8,
  },
  // Address block
  addressBlock: {
    marginBottom: 10,
  },
  addressName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  // Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    minHeight: 20,
    alignItems: "center",
  },
  tableRowLast: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableCell: {
    padding: "4 4",
    fontSize: 7,
  },
  tableCellHeader: {
    padding: "5 4",
    fontSize: 7,
    fontWeight: "bold",
  },
  // Column widths for main table
  colLine: { width: "4%", textAlign: "center" },
  colSku: { width: "10%" },
  colDescription: { width: "24%" },
  colQty: { width: "6%", textAlign: "right" },
  colUom: { width: "5%", textAlign: "center" },
  colPrice: { width: "9%", textAlign: "right" },
  colDiscount: { width: "7%", textAlign: "right" },
  colTax: { width: "8%", textAlign: "right" },
  colTotal: { width: "10%", textAlign: "right" },
  colDelivery: { width: "9%", textAlign: "center" },
  colCompliance: { width: "8%", textAlign: "center" },
  // Totals
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsTable: {
    width: 200,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  totalsRowFinal: {
    borderTopWidth: 1,
    borderBottomWidth: 2,
    borderColor: "#000",
    fontWeight: "bold",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 8,
  },
  totalsValue: {
    fontSize: 8,
    textAlign: "right",
  },
  // Line details
  lineDetailSection: {
    marginTop: 5,
  },
  lineDetailBlock: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  lineDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  lineDetailTitle: {
    fontSize: 9,
    fontWeight: "bold",
  },
  lineDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  lineDetailItem: {
    width: "25%",
    marginBottom: 3,
  },
  lineDetailLabel: {
    fontSize: 7,
    color: "#666",
  },
  lineDetailValue: {
    fontSize: 8,
  },
  // Compliance/Requirements
  requirementsBlock: {
    marginTop: 5,
    padding: 6,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
  },
  requirementsTitle: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  requirementsList: {
    fontSize: 7,
  },
  // Charges block
  chargesBlock: {
    marginTop: 5,
  },
  chargeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    paddingVertical: 1,
  },
  // Terms section
  termsSection: {
    marginTop: 10,
  },
  termItem: {
    marginBottom: 8,
  },
  termTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  termText: {
    fontSize: 7,
    textAlign: "justify",
  },
  // Signature section
  signatureSection: {
    marginTop: 30,
    flexDirection: "row",
    gap: 50,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginTop: 25,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 7,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: "#999",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#666",
  },
  // Notes/Special Instructions
  notesBlock: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
  },
  // Page break hint
  pageBreak: {
    marginTop: 20,
  },
})

interface POPDFDocumentProps {
  poHeader: POHeader
  lineItems: LineItem[]
  charges: POCharge[]
  vendorContact: VendorContact
  version: string
  companyInfo?: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
  }
}

const DEFAULT_COMPANY_INFO = {
  name: "Sindri Aerospace Inc.",
  address: "555 Innovation Drive",
  city: "San Diego",
  state: "CA",
  zip: "92101",
  phone: "+1 (858) 555-0100",
  email: "procurement@sindri-aerospace.com",
}

function getLineCharges(lineNumber: number, charges: POCharge[]): POCharge[] {
  return charges.filter(c => c.appliesToLines?.includes(lineNumber))
}

function getHeaderCharges(charges: POCharge[]): POCharge[] {
  return charges.filter(c => !c.appliesToLines || c.appliesToLines.length === 0)
}

function getComplianceCodes(line: LineItem): string[] {
  const codes: string[] = []
  const q = line.qualityRequirements
  if (q.inspectionRequired) codes.push("INSP")
  if (q.cocRequired) codes.push("COC")
  if (q.faiRequired) codes.push("FAI")
  if (q.mtrRequired) codes.push("MTR")
  if (q.sourceInspection) codes.push("SRC")
  return codes
}

function getComplianceDescriptions(line: LineItem): string[] {
  const items: string[] = []
  const q = line.qualityRequirements
  if (q.inspectionRequired) items.push("Incoming Inspection Required")
  if (q.cocRequired) items.push("Certificate of Conformance (COC) Required")
  if (q.faiRequired) items.push("First Article Inspection (FAI) Required")
  if (q.mtrRequired) items.push("Material Test Report (MTR) Required")
  if (q.sourceInspection) items.push("Source Inspection at Seller's Facility Required")
  return items
}

export function POPDFDocument({
  poHeader,
  lineItems,
  charges,
  vendorContact,
  version,
  companyInfo = DEFAULT_COMPANY_INFO,
}: POPDFDocumentProps) {
  const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0)
  const totalDiscount = lineItems.reduce((sum, line) => sum + line.discountAmount, 0)
  const totalTax = lineItems.reduce((sum, line) => sum + line.taxAmount, 0)
  const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0)
  const totalExpedite = lineItems.reduce((sum, line) => sum + (line.expediteFee || 0), 0)
  const grandTotal = subtotal - totalDiscount + totalTax + totalCharges

  const headerCharges = getHeaderCharges(charges)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <Document>
      {/* PAGE 1: Purchase Order */}
      <Page size="LETTER" style={styles.page}>
        {/* Document Header */}
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>Purchase Order</Text>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <Text>{companyInfo.address}</Text>
              <Text>{companyInfo.city}, {companyInfo.state} {companyInfo.zip}</Text>
              <Text>{companyInfo.phone}</Text>
              <Text>{companyInfo.email}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.poNumber}>PO# {poHeader.poNumber}</Text>
              <Text>Version: {version}</Text>
              <Text>Date Issued: {poHeader.dates.issued}</Text>
              <Text>Page 1 of 3</Text>
            </View>
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.section}>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.addressBlock}>
                <Text style={styles.addressName}>{poHeader.supplier.name}</Text>
                <Text>Attn: {vendorContact.name}, {vendorContact.title}</Text>
                <Text>{vendorContact.email}</Text>
                <Text>{vendorContact.phone}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Vendor Code:</Text>
                <Text style={styles.fieldValue}>{poHeader.supplier.code}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Ship To</Text>
              <View style={styles.addressBlock}>
                <Text style={styles.addressName}>{poHeader.shipping.destination}</Text>
                <Text>{poHeader.shipping.address.line1}</Text>
                {poHeader.shipping.address.line2 && <Text>{poHeader.shipping.address.line2}</Text>}
                <Text>{poHeader.shipping.address.city}, {poHeader.shipping.address.state} {poHeader.shipping.address.zip}</Text>
                <Text>{poHeader.shipping.address.country}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Terms</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Payment Terms:</Text>
                <Text style={styles.fieldValue}>{poHeader.payment.terms}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Shipping Terms:</Text>
                <Text style={styles.fieldValue}>{poHeader.shipping.terms}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Shipping Method:</Text>
                <Text style={styles.fieldValue}>{poHeader.shipping.method}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Currency:</Text>
                <Text style={styles.fieldValue}>{poHeader.payment.currency}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Buyer Contact:</Text>
                <Text style={styles.fieldValue}>{poHeader.buyer.name}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Expected Completion:</Text>
                <Text style={styles.fieldValue}>{poHeader.dates.expectedCompletion}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        {poHeader.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>SPECIAL INSTRUCTIONS:</Text>
            <Text style={styles.notesText}>{poHeader.notes}</Text>
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule of Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.colLine]}>Line</Text>
              <Text style={[styles.tableCellHeader, styles.colSku]}>Item/SKU</Text>
              <Text style={[styles.tableCellHeader, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableCellHeader, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableCellHeader, styles.colUom]}>UOM</Text>
              <Text style={[styles.tableCellHeader, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableCellHeader, styles.colDiscount]}>Disc %</Text>
              <Text style={[styles.tableCellHeader, styles.colTax]}>Tax</Text>
              <Text style={[styles.tableCellHeader, styles.colTotal]}>Ext. Total</Text>
              <Text style={[styles.tableCellHeader, styles.colDelivery]}>Need Date</Text>
              <Text style={[styles.tableCellHeader, styles.colCompliance]}>Req'd</Text>
            </View>
            {lineItems.map((line, index) => {
              const complianceCodes = getComplianceCodes(line)
              const isLast = index === lineItems.length - 1
              return (
                <View key={line.id} style={isLast ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colLine]}>{line.lineNumber}</Text>
                  <Text style={[styles.tableCell, styles.colSku]}>
                    {line.sku}
                    {line.itemRevision ? ` (${line.itemRevision})` : ""}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDescription]}>{line.name}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{line.quantityOrdered}</Text>
                  <Text style={[styles.tableCell, styles.colUom]}>{line.unitOfMeasure}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(line.unitPrice)}</Text>
                  <Text style={[styles.tableCell, styles.colDiscount]}>
                    {line.discountPercent > 0 ? `${line.discountPercent}%` : "—"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTax]}>{formatCurrency(line.taxAmount)}</Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(line.lineTotalWithTax)}</Text>
                  <Text style={[styles.tableCell, styles.colDelivery]}>{line.need?.needDate || line.promisedDate}</Text>
                  <Text style={[styles.tableCell, styles.colCompliance]}>
                    {complianceCodes.length > 0 ? complianceCodes.join(",") : "—"}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* Compliance Code Legend */}
          <Text style={{ fontSize: 6, color: "#666", marginTop: 3 }}>
            Compliance Codes: INSP=Incoming Inspection, COC=Certificate of Conformance, FAI=First Article Inspection, MTR=Material Test Report, SRC=Source Inspection
          </Text>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Lines Subtotal:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {totalDiscount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Less Discounts:</Text>
                <Text style={styles.totalsValue}>({formatCurrency(totalDiscount)})</Text>
              </View>
            )}
            {headerCharges.map((charge) => (
              <View key={charge.id} style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{charge.name}:</Text>
                <Text style={styles.totalsValue}>{formatCurrency(charge.amount)}</Text>
              </View>
            ))}
            {totalExpedite > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Expedite Charges:</Text>
                <Text style={styles.totalsValue}>{formatCurrency(totalExpedite)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Tax:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(totalTax)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsRowFinal]}>
              <Text style={[styles.totalsLabel, { fontWeight: "bold" }]}>TOTAL ORDER VALUE:</Text>
              <Text style={[styles.totalsValue, { fontWeight: "bold" }]}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{poHeader.poNumber} v{version}</Text>
          <Text>Generated: {today}</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>

      {/* PAGE 2: Line Item Details */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.documentHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <Text>Purchase Order: {poHeader.poNumber}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.poNumber}>Version: {version}</Text>
              <Text>Page 2 of 3</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Line Item Details & Requirements</Text>

        <View style={styles.lineDetailSection}>
          {lineItems.map((line) => {
            const lineCharges = getLineCharges(line.lineNumber, charges)
            const complianceItems = getComplianceDescriptions(line)

            return (
              <View key={line.id} style={styles.lineDetailBlock}>
                <View style={styles.lineDetailHeader}>
                  <Text style={styles.lineDetailTitle}>
                    LINE {line.lineNumber}: {line.sku} — {line.name}
                    {line.itemRevision && ` (Rev. ${line.itemRevision})`}
                    {line.expedite && " [EXPEDITE]"}
                  </Text>
                  <Text style={styles.lineDetailTitle}>{formatCurrency(line.lineTotalWithTax)}</Text>
                </View>

                <View style={styles.lineDetailGrid}>
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Quantity Ordered</Text>
                    <Text style={styles.lineDetailValue}>{line.quantityOrdered} {line.unitOfMeasure}</Text>
                  </View>
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Unit Price</Text>
                    <Text style={styles.lineDetailValue}>{formatCurrency(line.unitPrice)}</Text>
                  </View>
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Extended Price</Text>
                    <Text style={styles.lineDetailValue}>{formatCurrency(line.subtotal)}</Text>
                  </View>
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Required Delivery</Text>
                    <Text style={styles.lineDetailValue}>{line.need?.needDate || line.promisedDate}</Text>
                  </View>
                  {line.discountPercent > 0 && (
                    <View style={styles.lineDetailItem}>
                      <Text style={styles.lineDetailLabel}>Discount ({line.discountPercent}%)</Text>
                      <Text style={styles.lineDetailValue}>({formatCurrency(line.discountAmount)})</Text>
                    </View>
                  )}
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Tax ({(line.taxRate * 100).toFixed(2)}%)</Text>
                    <Text style={styles.lineDetailValue}>{formatCurrency(line.taxAmount)}</Text>
                  </View>
                  {line.expediteFee && line.expediteFee > 0 && (
                    <View style={styles.lineDetailItem}>
                      <Text style={styles.lineDetailLabel}>Expedite Fee</Text>
                      <Text style={styles.lineDetailValue}>{formatCurrency(line.expediteFee)}</Text>
                    </View>
                  )}
                  <View style={styles.lineDetailItem}>
                    <Text style={styles.lineDetailLabel}>Line Total (incl. Tax)</Text>
                    <Text style={styles.lineDetailValue}>{formatCurrency(line.lineTotalWithTax)}</Text>
                  </View>
                </View>

                {/* Line-specific charges */}
                {lineCharges.length > 0 && (
                  <View style={styles.chargesBlock}>
                    <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: 2 }}>Line Charges:</Text>
                    {lineCharges.map((charge) => (
                      <View key={charge.id} style={styles.chargeRow}>
                        <Text>{charge.name}{charge.notes ? ` (${charge.notes})` : ""}</Text>
                        <Text>{formatCurrency(charge.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Compliance requirements */}
                {complianceItems.length > 0 && (
                  <View style={styles.requirementsBlock}>
                    <Text style={styles.requirementsTitle}>Quality & Compliance Requirements:</Text>
                    <Text style={styles.requirementsList}>
                      {complianceItems.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <View style={styles.footer}>
          <Text>{poHeader.poNumber} v{version}</Text>
          <Text>Generated: {today}</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>

      {/* PAGE 3: Terms and Conditions + Signature */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.documentHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <Text>Purchase Order: {poHeader.poNumber}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.poNumber}>Version: {version}</Text>
              <Text>Page 3 of 3</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Terms and Conditions</Text>

        <View style={styles.termsSection}>
          {PO_TERMS_AND_CONDITIONS.map((term) => (
            <View key={term.id} style={styles.termItem}>
              <Text style={styles.termTitle}>{term.id}. {term.title}</Text>
              <Text style={styles.termText}>{term.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>{poHeader.poNumber} v{version}</Text>
          <Text>Generated: {today}</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>

      {/* PAGE 4: Acknowledgment */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.documentHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{companyInfo.name}</Text>
              <Text>Purchase Order: {poHeader.poNumber}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.poNumber}>Version: {version}</Text>
              <Text>ACKNOWLEDGMENT</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Order Acknowledgment</Text>
          <Text style={{ marginBottom: 15, textAlign: "justify" }}>
            By executing this Acknowledgment, Seller confirms receipt of Purchase Order {poHeader.poNumber} (Version {version})
            and agrees to furnish the goods and/or services specified therein in accordance with all terms, conditions,
            specifications, and requirements set forth in this Purchase Order. Seller acknowledges that it has read and
            understands all terms and conditions and agrees to be bound thereby.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Purchase Order:</Text>
                <Text style={styles.fieldValue}>{poHeader.poNumber}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Version:</Text>
                <Text style={styles.fieldValue}>{version}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Total Lines:</Text>
                <Text style={styles.fieldValue}>{lineItems.length}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Total Value:</Text>
                <Text style={styles.fieldValue}>{formatCurrency(grandTotal)}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Currency:</Text>
                <Text style={styles.fieldValue}>{poHeader.payment.currency}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Expected Completion:</Text>
                <Text style={styles.fieldValue}>{poHeader.dates.expectedCompletion}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureTitle}>Buyer ({companyInfo.name})</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Printed Name and Title</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureTitle}>Seller ({poHeader.supplier.name})</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Printed Name and Title</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        <View style={[styles.notesBlock, { marginTop: 30 }]}>
          <Text style={styles.notesTitle}>INSTRUCTIONS FOR SELLER:</Text>
          <Text style={styles.notesText}>
            1. Execute this Acknowledgment and return within three (3) business days of receipt.{"\n"}
            2. Email signed acknowledgment to: {poHeader.buyer.email}{"\n"}
            3. Reference Purchase Order number {poHeader.poNumber} on all correspondence, invoices, packing lists, and shipping documents.{"\n"}
            4. Contact Buyer immediately if unable to comply with any term or delivery requirement.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>{poHeader.poNumber} v{version}</Text>
          <Text>Generated: {today}</Text>
          <Text>CONFIDENTIAL</Text>
        </View>
      </Page>
    </Document>
  )
}
