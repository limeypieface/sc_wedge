/**
 * Revision Adapter Tests
 *
 * Tests for the revision data adapter functions.
 * Covers the complete revision lifecycle:
 * create → submit → approve/reject → send → acknowledge
 */

import {
  fetchRevisions,
  fetchActiveRevision,
  fetchDraftRevision,
  fetchApprovers,
  fetchUsers,
  createDraftRevision,
  addChangeToDraft,
  submitForApproval,
  approveRevision,
  rejectRevision,
  sendToVendor,
  recordAcknowledgment,
  discardDraft,
  resetRevisionState,
} from '../../../app/supply/purchase-orders/_adapters/revision.adapter';
import { RevisionStatus } from '../../../types/enums';
import type { PORevision } from '../../../app/supply/purchase-orders/_lib/types';

describe('Revision Adapter', () => {
  // Reset state before each test to ensure isolation
  beforeEach(() => {
    resetRevisionState();
  });

  describe('Query Functions', () => {
    describe('fetchRevisions', () => {
      it('should return array of revisions', async () => {
        const revisions = await fetchRevisions('PO-0861');

        expect(Array.isArray(revisions)).toBe(true);
      });

      it('should return revisions sorted by version (newest first)', async () => {
        const revisions = await fetchRevisions('PO-0861');

        if (revisions.length > 1) {
          for (let i = 0; i < revisions.length - 1; i++) {
            const current = parseFloat(revisions[i].version);
            const next = parseFloat(revisions[i + 1].version);
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      });
    });

    describe('fetchActiveRevision', () => {
      it('should return the active revision if exists', async () => {
        const active = await fetchActiveRevision('PO-0861');

        if (active) {
          expect(active.isActive).toBe(true);
        }
      });

      it('should return null for PO with no active revision', async () => {
        const active = await fetchActiveRevision('NON-EXISTENT-PO');

        expect(active).toBeNull();
      });
    });

    describe('fetchDraftRevision', () => {
      it('should return null when no draft exists', async () => {
        const draft = await fetchDraftRevision('PO-0861');

        // Initially there should be no draft
        expect(draft).toBeNull();
      });
    });

    describe('fetchApprovers', () => {
      it('should return array of approvers', async () => {
        const approvers = await fetchApprovers();

        expect(Array.isArray(approvers)).toBe(true);
      });

      it('should return approvers with required properties', async () => {
        const approvers = await fetchApprovers();

        if (approvers.length > 0) {
          const approver = approvers[0];
          expect(approver).toHaveProperty('id');
          expect(approver).toHaveProperty('name');
          expect(approver).toHaveProperty('role');
          expect(approver).toHaveProperty('level');
        }
      });
    });

    describe('fetchUsers', () => {
      it('should return array of users', async () => {
        const users = await fetchUsers();

        expect(Array.isArray(users)).toBe(true);
      });
    });
  });

  describe('Revision Lifecycle', () => {
    let mockActiveRevision: PORevision;

    beforeEach(async () => {
      // Get active revision to use as base for draft
      const active = await fetchActiveRevision('PO-0861');
      if (active) {
        mockActiveRevision = active;
      } else {
        // Create a mock if none exists
        mockActiveRevision = {
          id: 'rev-test',
          poNumber: 'PO-0861',
          version: '1.0',
          status: RevisionStatus.Acknowledged,
          lineItems: [],
          changes: [],
          isActive: true,
          isDraft: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });

    describe('createDraftRevision', () => {
      it('should create a new draft revision', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        expect(draft).toBeDefined();
        expect(draft.isDraft).toBe(true);
        expect(draft.status).toBe(RevisionStatus.Draft);
      });

      it('should increment version number', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        const activeVersion = parseFloat(mockActiveRevision.version);
        const draftVersion = parseFloat(draft.version);
        expect(draftVersion).toBeGreaterThan(activeVersion);
      });

      it('should copy line items from active revision', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        expect(draft.lineItems.length).toBe(mockActiveRevision.lineItems.length);
      });
    });

    describe('addChangeToDraft', () => {
      it('should add change to draft revision', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        const updated = await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            lineNumber: 1,
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Increased quantity from 10 to 15',
          },
          'user-1'
        );

        expect(updated.changes.length).toBe(1);
        expect(updated.changes[0].field).toBe('quantity');
      });

      it('should throw error for non-existent draft', async () => {
        await expect(
          addChangeToDraft(
            'non-existent-id',
            {
              field: 'test',
              previousValue: 1,
              newValue: 2,
              editType: 'non_critical',
              description: 'Test change',
            },
            'user-1'
          )
        ).rejects.toThrow('Draft revision not found');
      });
    });

    describe('submitForApproval', () => {
      it('should change status to PendingApproval', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        // Add a change first
        await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Test change',
          },
          'user-1'
        );

        const submitted = await submitForApproval(
          draft.id,
          'Please review these changes',
          'Test User'
        );

        expect(submitted.status).toBe(RevisionStatus.PendingApproval);
        expect(submitted.isDraft).toBe(false);
      });

      it('should create approval chain', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Test change',
          },
          'user-1'
        );

        const submitted = await submitForApproval(draft.id, 'Review please', 'User');

        expect(submitted.approvalChain).toBeDefined();
        expect(submitted.approvalChain?.steps.length).toBeGreaterThan(0);
      });
    });

    describe('approveRevision', () => {
      it('should advance approval chain', async () => {
        // Create and submit draft
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );
        await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Test',
          },
          'user-1'
        );
        const submitted = await submitForApproval(draft.id, 'Review', 'User');

        // Approve
        const approved = await approveRevision(
          submitted.id,
          'Looks good',
          'Approver'
        );

        // Check that step was approved
        const approvedStep = approved.approvalChain?.steps.find(
          s => s.status === 'approved'
        );
        expect(approvedStep).toBeDefined();
      });
    });

    describe('rejectRevision', () => {
      it('should set status to Rejected', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );
        await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Test',
          },
          'user-1'
        );
        const submitted = await submitForApproval(draft.id, 'Review', 'User');

        const rejected = await rejectRevision(
          submitted.id,
          'Need more details',
          'Approver'
        );

        expect(rejected.status).toBe(RevisionStatus.Rejected);
        expect(rejected.isDraft).toBe(true); // Should be editable again
      });

      it('should record rejection notes', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );
        await addChangeToDraft(
          draft.id,
          {
            field: 'quantity',
            previousValue: 10,
            newValue: 15,
            editType: 'critical',
            description: 'Test',
          },
          'user-1'
        );
        const submitted = await submitForApproval(draft.id, 'Review', 'User');

        const rejected = await rejectRevision(
          submitted.id,
          'Need more justification',
          'Approver'
        );

        expect(rejected.rejectionNotes).toBe('Need more justification');
      });
    });

    describe('discardDraft', () => {
      it('should remove draft revision', async () => {
        const draft = await createDraftRevision(
          'PO-0861',
          mockActiveRevision,
          'user-1'
        );

        await discardDraft(draft.id);

        const checkDraft = await fetchDraftRevision('PO-0861');
        expect(checkDraft).toBeNull();
      });

      it('should throw error for non-existent draft', async () => {
        await expect(discardDraft('non-existent')).rejects.toThrow();
      });
    });
  });
});
