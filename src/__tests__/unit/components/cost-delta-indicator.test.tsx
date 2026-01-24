/**
 * CostDeltaIndicator Component Tests
 *
 * Tests for the cost change indicator component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CostDeltaIndicator } from '@/shared/ui/revisions/cost-delta-indicator';
import type { CostDeltaInfo } from '@/shared/ui/revisions/types';

describe('CostDeltaIndicator', () => {
  const createCostDelta = (overrides: Partial<CostDeltaInfo> = {}): CostDeltaInfo => ({
    delta: 100,
    percentChange: 0.1,
    exceedsThreshold: false,
    previousTotal: 1000,
    newTotal: 1100,
    ...overrides,
  });

  describe('Display', () => {
    it('should render Cost Change label', () => {
      render(<CostDeltaIndicator costDeltaInfo={createCostDelta()} />);

      expect(screen.getByText('Cost Change')).toBeInTheDocument();
    });

    it('should display positive delta with plus sign', () => {
      render(<CostDeltaIndicator costDeltaInfo={createCostDelta({ delta: 100, percentChange: 0.1 })} />);

      // Should show +$100.00 and +10.0%
      expect(screen.getByText(/\+\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument();
    });

    it('should display negative delta correctly', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({
            delta: -100,
            percentChange: -0.1,
          })}
        />
      );

      // Should show -$100.00
      expect(screen.getByText(/-\$100\.00/)).toBeInTheDocument();
    });
  });

  describe('Threshold Status', () => {
    it('should not show approval message when not exceeded', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: false })}
        />
      );

      expect(screen.queryByText(/requires approval/i)).not.toBeInTheDocument();
    });

    it('should show "Requires Approval" message when exceeded', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: true })}
        />
      );

      expect(screen.getByText(/requires approval/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should use green styling for positive delta', () => {
      const { container } = render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ delta: 100 })}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-green');
    });

    it('should use amber styling for negative delta', () => {
      const { container } = render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ delta: -100 })}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-amber');
    });
  });

  describe('Formatting', () => {
    it('should format large numbers with commas', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({
            delta: 12345.67,
          })}
        />
      );

      expect(screen.getByText(/\$12,345\.67/)).toBeInTheDocument();
    });

    it('should show one decimal place for percentage', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({
            percentChange: 0.0567,
          })}
        />
      );

      expect(screen.getByText(/5\.7%/)).toBeInTheDocument();
    });
  });
});
