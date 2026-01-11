/**
 * Approval Types Tests
 *
 * Tests for approval-related utility functions and calculations.
 */

import {
  calculateCostDelta,
  createApprovalChain,
  DEFAULT_APPROVAL_CONFIG,
} from '../../../app/supply/purchase-orders/_lib/types/approval.types';
import type { Approver, ApprovalConfig } from '../../../app/supply/purchase-orders/_lib/types';

describe('Approval Types', () => {
  describe('calculateCostDelta', () => {
    const defaultConfig = DEFAULT_APPROVAL_CONFIG;

    it('should calculate positive delta correctly', () => {
      const result = calculateCostDelta(1000, 1100, defaultConfig);

      expect(result.delta).toBe(100);
      expect(result.percentChange).toBeCloseTo(0.1); // 10%
    });

    it('should calculate negative delta correctly', () => {
      const result = calculateCostDelta(1000, 900, defaultConfig);

      expect(result.delta).toBe(-100);
      expect(result.percentChange).toBeCloseTo(-0.1); // -10%
    });

    it('should handle zero original cost', () => {
      const result = calculateCostDelta(0, 100, defaultConfig);

      expect(result.delta).toBe(100);
      expect(result.percentChange).toBe(0);
    });

    it('should detect when threshold is exceeded (by percentage)', () => {
      // 5% threshold, 10% change should exceed
      const result = calculateCostDelta(1000, 1100, defaultConfig);

      expect(result.exceedsThreshold).toBe(true);
    });

    it('should detect when threshold is exceeded (by absolute)', () => {
      // $500 threshold, $600 change should exceed
      const result = calculateCostDelta(1000, 1600, defaultConfig);

      expect(result.exceedsThreshold).toBe(true);
    });

    it('should not exceed threshold for small changes', () => {
      // 2% and $20 change should not exceed
      const result = calculateCostDelta(1000, 1020, defaultConfig);

      expect(result.exceedsThreshold).toBe(false);
    });

    it('should respect OR mode (either threshold triggers)', () => {
      const config: ApprovalConfig = {
        percentageThreshold: 0.05,
        absoluteThreshold: 500,
        mode: 'OR',
      };

      // Exceeds percentage but not absolute
      const result1 = calculateCostDelta(1000, 1060, config);
      expect(result1.exceedsThreshold).toBe(true);

      // Exceeds absolute but not percentage
      const result2 = calculateCostDelta(100000, 100550, config);
      expect(result2.exceedsThreshold).toBe(true);
    });

    it('should respect AND mode (both thresholds required)', () => {
      const config: ApprovalConfig = {
        percentageThreshold: 0.05,
        absoluteThreshold: 500,
        mode: 'AND',
      };

      // Exceeds percentage but not absolute
      const result1 = calculateCostDelta(1000, 1100, config);
      expect(result1.exceedsThreshold).toBe(false);

      // Exceeds both
      const result2 = calculateCostDelta(10000, 11000, config);
      expect(result2.exceedsThreshold).toBe(true);
    });

    it('should return all required fields', () => {
      const result = calculateCostDelta(1000, 1100, defaultConfig);

      expect(result).toHaveProperty('originalCost', 1000);
      expect(result).toHaveProperty('newCost', 1100);
      expect(result).toHaveProperty('delta');
      expect(result).toHaveProperty('percentChange');
      expect(result).toHaveProperty('exceedsThreshold');
    });
  });

  describe('createApprovalChain', () => {
    const mockApprovers: Approver[] = [
      { id: 'app-1', name: 'John', role: 'Manager', email: 'john@test.com', level: 1 },
      { id: 'app-2', name: 'Jane', role: 'Director', email: 'jane@test.com', level: 2 },
    ];

    it('should create chain with all approvers', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      expect(chain.steps).toHaveLength(2);
    });

    it('should set revision ID correctly', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      expect(chain.revisionId).toBe('rev-123');
    });

    it('should start at level 1', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      expect(chain.currentLevel).toBe(1);
    });

    it('should set all steps as pending initially', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      chain.steps.forEach(step => {
        expect(step.status).toBe('pending');
      });
    });

    it('should sort approvers by level', () => {
      const unsorted: Approver[] = [
        { id: 'app-2', name: 'Jane', role: 'Director', email: 'jane@test.com', level: 2 },
        { id: 'app-1', name: 'John', role: 'Manager', email: 'john@test.com', level: 1 },
      ];

      const chain = createApprovalChain('rev-123', unsorted);

      expect(chain.steps[0].level).toBe(1);
      expect(chain.steps[1].level).toBe(2);
    });

    it('should mark as not complete initially', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      expect(chain.isComplete).toBe(false);
    });

    it('should set startedAt timestamp', () => {
      const chain = createApprovalChain('rev-123', mockApprovers);

      expect(chain.startedAt).toBeDefined();
      expect(new Date(chain.startedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('DEFAULT_APPROVAL_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_APPROVAL_CONFIG.percentageThreshold).toBe(0.05);
      expect(DEFAULT_APPROVAL_CONFIG.absoluteThreshold).toBe(500);
      expect(DEFAULT_APPROVAL_CONFIG.mode).toBe('OR');
    });
  });
});
