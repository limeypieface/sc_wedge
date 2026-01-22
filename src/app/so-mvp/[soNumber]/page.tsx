"use client"

import { use } from "react"
import { SOMVPDetail } from "@/shared/ui/sales-orders/so-mvp-detail"

interface SOMVPPageProps {
  params: Promise<{
    soNumber: string
  }>
}

export default function SOMVPPage({ params }: SOMVPPageProps) {
  const { soNumber } = use(params)

  return <SOMVPDetail soNumber={soNumber} />
}
