"use client"

import { Badge } from "@/components/ui/badge"
import { RevisionStatus, RevisionStatusMeta } from "@/types/revision-status"
import { cn } from "@/lib/utils"

interface RevisionBadgeProps {
  version?: string
  status: RevisionStatus
  className?: string
  showVersion?: boolean
  forceShow?: boolean // Show even for Acknowledged status
}

export function RevisionBadge({
  version,
  status,
  className,
  showVersion = true,
  forceShow = false,
}: RevisionBadgeProps) {
  const statusMeta = RevisionStatusMeta.meta[status]

  // Determine badge variant based on status
  const getVariantStyles = () => {
    switch (status) {
      case RevisionStatus.Draft:
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
      case RevisionStatus.PendingApproval:
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"
      case RevisionStatus.Approved:
        return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
      case RevisionStatus.Sent:
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100"
      case RevisionStatus.Acknowledged:
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
      case RevisionStatus.Rejected:
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"
    }
  }

  // Don't show badge for acknowledged (active) revisions unless forced
  if (status === RevisionStatus.Acknowledged && !forceShow) {
    return null
  }

  const label = showVersion && version
    ? `v${version} ${statusMeta.label}`
    : statusMeta.label

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs px-2 py-0.5 gap-1.5",
        getVariantStyles(),
        className
      )}
    >
      {statusMeta.icon}
      <span>{label}</span>
    </Badge>
  )
}
