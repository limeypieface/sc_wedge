/**
 * MVP Types
 *
 * Types used by the MVP detail components
 */

export interface MVPAttachment {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
}

export type MVPApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface MVPLineItemExtensions {
  // Quantity tracking
  quantityShipped?: number
  quantityReceived?: number
  quantityInspected?: number
  quantityAccepted?: number
  quantityOnHold?: number

  // Dates
  shippedAt?: string
  receivedAt?: string
  inspectedAt?: string
  acceptedAt?: string

  // Other fields
  lineStatus?: string
  inspectionRequired?: boolean
  isTaxable?: boolean
  taxRate?: number
  promisedDate?: string
  needByDate?: string
  leadTime?: number
  sourceRequestId?: string
  projectId?: string
  notes?: string
}
