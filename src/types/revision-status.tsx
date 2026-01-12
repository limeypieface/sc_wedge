import React from "react";
import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  FileEdit,
  Clock,
  CheckCircle2,
  Send,
  ThumbsUp,
  XCircle,
} from "lucide-react";

export enum RevisionStatus {
  Draft = "DRAFT",
  PendingApproval = "PENDING_APPROVAL",
  Approved = "APPROVED",
  Sent = "SENT",
  Acknowledged = "ACKNOWLEDGED",
  Rejected = "REJECTED",
}

export const RevisionStatusMeta = createEnumMeta(
  RevisionStatus,
  {
    [RevisionStatus.Draft]: {
      label: "Draft",
      icon: React.createElement(FileEdit, { className: "h-4 w-4" }),
    },
    [RevisionStatus.PendingApproval]: {
      label: "Pending Approval",
      icon: React.createElement(Clock, { className: "h-4 w-4" }),
    },
    [RevisionStatus.Approved]: {
      label: "Approved",
      icon: React.createElement(CheckCircle2, { className: "h-4 w-4" }),
    },
    [RevisionStatus.Sent]: {
      label: "Sent to Supplier",
      icon: React.createElement(Send, { className: "h-4 w-4" }),
    },
    [RevisionStatus.Acknowledged]: {
      label: "Acknowledged",
      icon: React.createElement(ThumbsUp, { className: "h-4 w-4" }),
    },
    [RevisionStatus.Rejected]: {
      label: "Rejected",
      icon: React.createElement(XCircle, { className: "h-4 w-4" }),
    },
  },
  [
    RevisionStatus.Draft,
    RevisionStatus.PendingApproval,
    RevisionStatus.Approved,
    RevisionStatus.Sent,
    RevisionStatus.Acknowledged,
    RevisionStatus.Rejected,
  ]
);
