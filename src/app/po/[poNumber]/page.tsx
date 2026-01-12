"use client"

import { use } from "react"
import { PurchaseOrderDetail } from "@/components/purchase-order-detail"
import { getPOData } from "@/lib/mock-data"
import { notFound } from "next/navigation"

interface POPageProps {
  params: Promise<{
    poNumber: string
  }>
}

export default function POPage({ params }: POPageProps) {
  const { poNumber } = use(params)

  // Validate PO exists
  const poData = getPOData(poNumber)
  if (!poData) {
    notFound()
  }

  return <PurchaseOrderDetail poNumber={poNumber} />
}
