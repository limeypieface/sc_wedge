"use server"

export interface POInsights {
  summary: string
  metrics: {
    fulfillmentRate: number
    totalLines: number
    linesReceived: number
    qualityHolds: number
    openIssues: number
  }
  issues: Array<{
    title: string
    description: string
    severity: "critical" | "warning" | "info"
    affectedItem: string
  }>
  recommendedActions: Array<{
    action: string
    reason: string
    priority: "high" | "medium" | "low"
  }>
  nextSteps: string
}

export async function generatePOInsights(poData: {
  poNumber: string
  status: string
  supplier: string
  orderDate: string
  totalAmount: number
  lineItems: Array<{
    id: number
    sku: string
    name: string
    quantity: number
    status: string
    quantityOrdered?: number
    quantityReceived?: number
    quantityInQualityHold?: number
    promisedDate?: string
  }>
  urgency: string
  tasks?: Array<{
    id: number
    title: string
    status: string
    reason?: string
    createdBy?: string
    suggestedAction?: string
  }>
}): Promise<POInsights> {
  // Calculate metrics
  const totalLines = poData.lineItems.length
  const linesReceived = poData.lineItems.filter(
    (item) => item.status === "received" || item.status === "closed"
  ).length
  const fulfillmentRate = Math.round((linesReceived / totalLines) * 100)

  const qualityHolds = poData.lineItems.reduce(
    (sum, item) => sum + (item.quantityInQualityHold || 0),
    0
  )

  const criticalTasks = poData.tasks?.filter((t) => t.status === "critical") || []
  const openIssues = criticalTasks.length

  // Identify issues
  const issues: POInsights["issues"] = []

  // Check for quality holds
  const itemsWithQualityHold = poData.lineItems.filter(
    (item) => (item.quantityInQualityHold || 0) > 0
  )
  itemsWithQualityHold.forEach((item) => {
    issues.push({
      title: "Quality Hold",
      description: `${item.quantityInQualityHold} unit(s) are in quality hold and require inspection before acceptance.`,
      severity: "warning",
      affectedItem: item.sku,
    })
  })

  // Check for items on hold
  const itemsOnHold = poData.lineItems.filter((item) => item.status === "on hold")
  itemsOnHold.forEach((item) => {
    issues.push({
      title: "Line Item On Hold",
      description: `This line is currently on hold and not progressing. Review required.`,
      severity: "warning",
      affectedItem: item.sku,
    })
  })

  // Check for partial receipts with outstanding quantities
  const partialItems = poData.lineItems.filter(
    (item) =>
      item.status === "partially received" &&
      (item.quantityReceived || 0) < (item.quantityOrdered || item.quantity)
  )
  partialItems.forEach((item) => {
    const outstanding = (item.quantityOrdered || item.quantity) - (item.quantityReceived || 0)
    issues.push({
      title: "Partial Receipt",
      description: `${outstanding} unit(s) still outstanding. Follow up with vendor on remaining shipment.`,
      severity: "info",
      affectedItem: item.sku,
    })
  })

  // Check for items pending acknowledgment (open status with no movement)
  const unacknowledgedItems = poData.lineItems.filter(
    (item) => item.status === "open" && (item.quantityReceived || 0) === 0
  )
  if (unacknowledgedItems.length > 0) {
    issues.push({
      title: "Pending Vendor Response",
      description: `${unacknowledgedItems.length} line(s) awaiting vendor acknowledgment or shipment.`,
      severity: "info",
      affectedItem: unacknowledgedItems.map((i) => i.sku).join(", "),
    })
  }

  // Add critical task issues
  criticalTasks.forEach((task) => {
    issues.push({
      title: task.title,
      description: task.reason || "Critical issue requiring immediate attention.",
      severity: "critical",
      affectedItem: "PO-level",
    })
  })

  // Sort issues by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Generate recommended actions
  const recommendedActions: POInsights["recommendedActions"] = []

  if (qualityHolds > 0) {
    recommendedActions.push({
      action: "Review quality hold items",
      reason: `${qualityHolds} unit(s) in quality hold need inspection. Resolve to complete receipt.`,
      priority: "high",
    })
  }

  if (itemsOnHold.length > 0) {
    recommendedActions.push({
      action: "Investigate held line items",
      reason: `${itemsOnHold.length} line(s) are on hold. Determine reason and path to resolution.`,
      priority: "high",
    })
  }

  if (partialItems.length > 0) {
    recommendedActions.push({
      action: "Follow up on partial shipments",
      reason: `Contact ${poData.supplier} for ETA on remaining quantities for ${partialItems.length} line(s).`,
      priority: "medium",
    })
  }

  if (unacknowledgedItems.length > 0) {
    recommendedActions.push({
      action: "Request vendor acknowledgment",
      reason: `${unacknowledgedItems.length} line(s) have not been acknowledged. Confirm vendor receipt of PO.`,
      priority: "medium",
    })
  }

  if (fulfillmentRate === 100 && qualityHolds === 0) {
    recommendedActions.push({
      action: "Proceed to invoice matching",
      reason: "All items received and accepted. Ready for AP processing.",
      priority: "low",
    })
  }

  // Generate summary
  let summary = ""
  if (fulfillmentRate === 100 && issues.length === 0) {
    summary = `${poData.poNumber} is fully received with no outstanding issues. All ${totalLines} line items from ${poData.supplier} have been accepted. This PO is ready for invoice matching and payment processing.`
  } else if (fulfillmentRate === 100 && issues.length > 0) {
    summary = `${poData.poNumber} has received all shipments, but ${issues.length} issue(s) require attention before completion. Quality holds or exceptions need resolution before proceeding to payment.`
  } else if (fulfillmentRate >= 50) {
    summary = `${poData.poNumber} is ${fulfillmentRate}% complete with ${linesReceived} of ${totalLines} lines received. ${issues.length > 0 ? `There are ${issues.length} issue(s) to address.` : "No critical issues identified."} Follow up with ${poData.supplier} on remaining items.`
  } else {
    summary = `${poData.poNumber} is in early fulfillment stages (${fulfillmentRate}% complete). ${totalLines - linesReceived} of ${totalLines} lines are pending shipment from ${poData.supplier}. ${issues.length > 0 ? `${issues.length} issue(s) require monitoring.` : ""}`
  }

  // Generate next steps
  let nextSteps = ""
  if (recommendedActions.length === 0) {
    nextSteps = "No immediate actions required. Continue monitoring for any updates from the vendor."
  } else {
    const highPriorityCount = recommendedActions.filter((a) => a.priority === "high").length
    if (highPriorityCount > 0) {
      nextSteps = `Focus on the ${highPriorityCount} high-priority action(s) first. These are blocking PO completion and should be addressed today.`
    } else {
      nextSteps = `Complete the recommended actions in order of priority to move this PO toward closure. No urgent blockers identified.`
    }
  }

  return {
    summary,
    metrics: {
      fulfillmentRate,
      totalLines,
      linesReceived,
      qualityHolds,
      openIssues,
    },
    issues,
    recommendedActions,
    nextSteps,
  }
}
