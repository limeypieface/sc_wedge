/**
 * CostDeltaIndicator Component Tests
 *
 * Tests for the cost change indicator component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CostDeltaIndicator } from '../../../app/supply/purchase-orders/_components/revision-status-panel/cost-delta-indicator';
import type { CostDeltaInfo } from '../../../app/supply/purchase-orders/_lib/types';

describe('CostDeltaIndicator', () => {
  const createCostDelta = (overrides: Partial<CostDeltaInfo> = {}): CostDeltaInfo => ({
    originalCost: 1000,
    newCost: 1100,
    delta: 100,
    percentChange: 0.1,
    exceedsThreshold: false,
    ...overrides,
  });

  describe('Display', () => {
    it('should render Cost Change label', () => {
      render(<CostDeltaIndicator costDeltaInfo={createCostDelta()} />);

      expect(screen.getByText('Cost Change')).toBeInTheDocument();
    });

    it('should display positive delta with plus sign', () => {
      render(<CostDeltaIndicator costDeltaInfo={createCostDelta({ delta: 100 })} />);

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
    it('should show "Within threshold" message when not exceeded', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: false })}
        />
      );

      expect(screen.getByText(/within threshold/i)).toBeInTheDocument();
      expect(screen.getByText(/no approval needed/i)).toBeInTheDocument();
    });

    it('should show "Exceeds threshold" message when exceeded', () => {
      render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: true })}
        />
      );

      expect(screen.getByText(/exceeds threshold/i)).toBeInTheDocument();
      expect(screen.getByText(/approval required/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should use primary styling when within threshold', () => {
      const { container } = render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: false })}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('border-primary');
    });

    it('should use destructive styling when exceeds threshold', () => {
      const { container } = render(
        <CostDeltaIndicator
          costDeltaInfo={createCostDelta({ exceedsThreshold: true })}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('border-destructive');
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
