/**
 * Revision Status Enum
 *
 * Represents the lifecycle of a PO revision/amendment.
 * Revisions go through an approval workflow before being sent to vendors.
 *
 * Workflow: Draft -> PendingApproval -> Approved -> Sent -> Acknowledged
 *           └──────────────> Rejected (back to Draft)
 *
 * @see PurchaseOrderStatus for overall PO states
 */

export enum RevisionStatus {
  /** Revision is being drafted, not yet submitted for approval */
  Draft = "DRAFT",

  /** Revision has been submitted and is awaiting approval */
  PendingApproval = "PENDING_APPROVAL",

  /** Revision has been approved internally */
  Approved = "APPROVED",

  /** Revision has been sent to the vendor */
  Sent = "SENT",

  /** Vendor has acknowledged receipt of the revision */
  Acknowledged = "ACKNOWLEDGED",

  /** Revision was rejected - needs modifications */
  Rejected = "REJECTED",
}

/**
 * Metadata for each revision status
 */
export interface RevisionStatusMeta {
  /** Human-readable label */
  label: string;

  /** Description for tooltips */
  description: string;

  /** CSS class for badge styling */
  className: string;

  /** Border color class for panels */
  borderClass: string;

  /** Whether edits are allowed */
  isEditable: boolean;

  /** Whether approval actions are available */
  canApprove: boolean;

  /** Whether it can be sent to vendor */
  canSend: boolean;

  /** Workflow step index (0-based) */
  stepIndex: number;
}

export const RevisionStatusMeta = {
  meta: {
    [RevisionStatus.Draft]: {
      label: "Draft",
      description: "Revision is being prepared",
      className: "bg-muted text-muted-foreground border-border",
      borderClass: "border-l-muted-foreground",
      isEditable: true,
      canApprove: false,
      canSend: false,
      stepIndex: 0,
    },
    [RevisionStatus.PendingApproval]: {
      label: "Pending Approval",
      description: "Awaiting approval from designated approvers",
      className: "bg-primary/10 text-primary border-primary/20",
      borderClass: "border-l-primary",
      isEditable: false,
      canApprove: true,
      canSend: false,
      stepIndex: 1,
    },
    [RevisionStatus.Approved]: {
      label: "Approved",
      description: "Revision has been approved, ready to send",
      className: "bg-primary/10 text-primary border-primary/20",
      borderClass: "border-l-primary",
      isEditable: false,
      canApprove: false,
      canSend: true,
      stepIndex: 2,
    },
    [RevisionStatus.Sent]: {
      label: "Sent",
      description: "Revision has been sent to vendor",
      className: "bg-primary/10 text-primary border-primary/20",
      borderClass: "border-l-primary",
      isEditable: false,
      canApprove: false,
      canSend: false,
      stepIndex: 3,
    },
    [RevisionStatus.Acknowledged]: {
      label: "Active",
      description: "Vendor has acknowledged this revision",
      className: "bg-primary/10 text-primary border-primary/20",
      borderClass: "border-l-primary",
      isEditable: false,
      canApprove: false,
      canSend: false,
      stepIndex: 4,
    },
    [RevisionStatus.Rejected]: {
      label: "Rejected",
      description: "Revision was rejected - needs modification",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      borderClass: "border-l-destructive",
      isEditable: true,
      canApprove: false,
      canSend: false,
      stepIndex: 0, // Back to draft-like state
    },
  } as Record<RevisionStatus, RevisionStatusMeta>,

  /**
   * Workflow step labels for progress visualization
   */
  workflowSteps: [
    { id: "draft", label: "Draft", status: RevisionStatus.Draft },
    { id: "approval", label: "Approval", status: RevisionStatus.PendingApproval },
    { id: "approved", label: "Approved", status: RevisionStatus.Approved },
    { id: "sent", label: "Sent", status: RevisionStatus.Sent },
    { id: "acknowledged", label: "Active", status: RevisionStatus.Acknowledged },
  ],

  /**
   * Get current workflow step index
   */
  getStepIndex(status: RevisionStatus): number {
    return this.meta[status].stepIndex;
  },
};
