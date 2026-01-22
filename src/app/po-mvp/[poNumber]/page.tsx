"use client"

import { use } from "react"
import { POMVPDetail } from "@/shared/ui/purchase-orders/po-mvp-detail"

interface POMVPPageProps {
  params: Promise<{
    poNumber: string
  }>
}

export default function POMVPPage({ params }: POMVPPageProps) {
  const { poNumber } = use(params)

  return <POMVPDetail poNumber={poNumber} />
}
