"use client"

import { use } from "react"
import { SalesOrderDetail } from "@/shared/ui/sales-orders/sales-order-detail"

interface SOPageProps {
  params: Promise<{
    soNumber: string
  }>
}

export default function SOPage({ params }: SOPageProps) {
  const { soNumber } = use(params)

  return <SalesOrderDetail soNumber={soNumber} />
}
