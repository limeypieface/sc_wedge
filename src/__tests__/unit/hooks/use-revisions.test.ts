/**
 * useRevisions Hook Tests
 *
 * Tests for the revision data fetching hooks.
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  useRevisions,
  useApprovers,
  useUsers,
  getLatestVersion,
  hasDraft,
} from '../../../app/supply/purchase-orders/_hooks/use-revisions';
import { RevisionStatus } from '../../../types/enums';
import type { PORevision } from '../../../app/supply/purchase-orders/_lib/types';
import { resetRevisionState } from '../../../app/supply/purchase-orders/_adapters/revision.adapter';

describe('useRevisions', () => {
  beforeEach(() => {
    resetRevisionState();
  });

  describe('Initial State', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      expect(result.current.loading).toBe(true);
    });

    it('should start with empty revisions array', () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      expect(result.current.revisions).toEqual([]);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch revisions for valid PO', async () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.revisions)).toBe(true);
    });

    it('should set loading to false after fetch', async () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Active Revision', () => {
    it('should return active revision if exists', async () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Active revision should be defined if mock data has one
      if (result.current.activeRevision) {
        expect(result.current.activeRevision.isActive).toBe(true);
      }
    });
  });

  describe('Draft Revision', () => {
    it('should return undefined draft initially', async () => {
      const { result } = renderHook(() => useRevisions('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // No draft should exist initially
      expect(result.current.draftRevision).toBeUndefined();
    });
  });
});

describe('useApprovers', () => {
  it('should fetch approvers list', async () => {
    const { result } = renderHook(() => useApprovers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.approvers)).toBe(true);
  });

  it('should return approvers with required properties', async () => {
    const { result } = renderHook(() => useApprovers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    if (result.current.approvers.length > 0) {
      const approver = result.current.approvers[0];
      expect(approver).toHaveProperty('id');
      expect(approver).toHaveProperty('name');
      expect(approver).toHaveProperty('level');
    }
  });
});

describe('useUsers', () => {
  it('should fetch users list', async () => {
    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.users)).toBe(true);
  });
});

describe('Helper Functions', () => {
  describe('getLatestVersion', () => {
    it('should return version from first revision (sorted newest first)', () => {
      const revisions = [
        { version: '3.0' },
        { version: '2.0' },
        { version: '1.0' },
      ] as PORevision[];

      expect(getLatestVersion(revisions)).toBe('3.0');
    });

    it('should return 1.0 for empty array', () => {
      expect(getLatestVersion([])).toBe('1.0');
    });
  });

  describe('hasDraft', () => {
    it('should return true when draft exists', () => {
      const draft = {
        id: 'rev-1',
        isDraft: true,
      } as PORevision;

      expect(hasDraft(draft)).toBe(true);
    });

    it('should return false when draft is undefined', () => {
      expect(hasDraft(undefined)).toBe(false);
    });
  });
});
