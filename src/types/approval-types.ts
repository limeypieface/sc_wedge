export type ApprovalAction = "approve" | "reject" | "request_changes";

export interface Approver {
  id: string;
  name: string;
  role: string;
  email: string;
  level: number; // 1 = first approver, 2 = second, etc.
}

export type ApprovalStepStatus = "pending" | "approved" | "rejected" | "skipped";

export interface ApprovalStep {
  id: string;
  level: number;
  approver: Approver;
  status: ApprovalStepStatus;
  action?: ApprovalAction;
  notes?: string;
  actionDate?: string;
  actionBy?: string;
}

export interface ApprovalChain {
  id: string;
  revisionId: string;
  steps: ApprovalStep[];
  currentLevel: number;
  isComplete: boolean;
  startedAt: string;
  completedAt?: string;
  outcome?: "approved" | "rejected";
}

// Helper type for the current user context
export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  email: string;
  isApprover: boolean;
  approverLevel?: number;
  approvalLimit: number;
}
