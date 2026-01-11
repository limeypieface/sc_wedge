/**
 * Sales Order Revision Status Enum
 *
 * Represents the lifecycle of a SO revision.
 * Revisions go through an approval workflow before being sent to customers.
 *
 * Workflow: Draft -> PendingApproval -> Approved -> Sent -> Confirmed
 *           └──────────────> Rejected (back to Draft)
 *
 * @see SalesOrderStatus for overall SO states
 */

export enum SORevisionStatus {
  /** Revision is being drafted, not yet submitted for approval */
  Draft = "draft",

  /** Revision has been submitted and is awaiting approval */
  PendingApproval = "pending_approval",

  /** Revision has been approved internally */
  Approved = "approved",

  /** Revision has been sent to the customer */
  Sent = "sent",

  /** Customer has confirmed the revision */
  Confirmed = "confirmed",

  /** Revision was rejected - needs modifications */
  Rejected = "rejected",
}

/**
 * Metadata for each SO revision status
 */
export interface SORevisionStatusMeta {
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

  /** Whether it can be sent to customer */
  canSend: boolean;

  /** Workflow step index (0-based) */
  stepIndex: number;
}

export const SORevisionStatusMeta = {
  meta: {
    [SORevisionStatus.Draft]: {
      label: "Draft",
      description: "Revision is being prepared",
      className: "bg-muted text-muted-foreground border-border",
      borderClass: "border-l-muted-foreground",
      isEditable: true,
      canApprove: false,
      canSend: false,
      stepIndex: 0,
    },
    [SORevisionStatus.PendingApproval]: {
      label: "Pending Approval",
      description: "Awaiting approval from designated approvers",
      className: "bg-amber-100 text-amber-800 border-amber-300",
      borderClass: "border-l-amber-500",
      isEditable: false,
      canApprove: true,
      canSend: false,
      stepIndex: 1,
    },
    [SORevisionStatus.Approved]: {
      label: "Approved",
      description: "Revision has been approved, ready to send",
      className: "bg-primary/10 text-primary border-primary/20",
      borderClass: "border-l-primary",
      isEditable: false,
      canApprove: false,
      canSend: true,
      stepIndex: 2,
    },
    [SORevisionStatus.Sent]: {
      label: "Sent to Customer",
      description: "Revision has been sent to customer",
      className: "bg-blue-100 text-blue-800 border-blue-300",
      borderClass: "border-l-blue-500",
      isEditable: false,
      canApprove: false,
      canSend: false,
      stepIndex: 3,
    },
    [SORevisionStatus.Confirmed]: {
      label: "Confirmed",
      description: "Customer has confirmed this revision",
      className: "bg-green-100 text-green-800 border-green-300",
      borderClass: "border-l-green-500",
      isEditable: false,
      canApprove: false,
      canSend: false,
      stepIndex: 4,
    },
    [SORevisionStatus.Rejected]: {
      label: "Rejected",
      description: "Revision was rejected - needs modification",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      borderClass: "border-l-destructive",
      isEditable: true,
      canApprove: false,
      canSend: false,
      stepIndex: 0, // Back to draft-like state
    },
  } as Record<SORevisionStatus, SORevisionStatusMeta>,

  /**
   * Workflow step labels for progress visualization
   */
  workflowSteps: [
    { id: "draft", label: "Draft", status: SORevisionStatus.Draft },
    { id: "approval", label: "Approval", status: SORevisionStatus.PendingApproval },
    { id: "approved", label: "Approved", status: SORevisionStatus.Approved },
    { id: "sent", label: "Sent", status: SORevisionStatus.Sent },
    { id: "confirmed", label: "Confirmed", status: SORevisionStatus.Confirmed },
  ],

  /**
   * Get current workflow step index
   */
  getStepIndex(status: SORevisionStatus): number {
    return this.meta[status].stepIndex;
  },
};
