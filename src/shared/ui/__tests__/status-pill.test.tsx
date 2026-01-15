/**
 * StatusPill Component Tests
 *
 * Tests for the StatusPill component including rendering,
 * configuration, colors, sizes, and utility functions.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  StatusPill,
  createStatusPillConfig,
  getStatusColorClasses,
  getStatusBorderClass,
  type StatusPillConfig,
} from '../status-pill';

// Test configuration
type TestStatus = 'pending' | 'approved' | 'rejected' | 'in_progress';

const TEST_CONFIG: StatusPillConfig<TestStatus> = {
  pending: { label: 'Pending', color: 'gray', description: 'Awaiting action' },
  approved: { label: 'Approved', color: 'green', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'red', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'blue' },
};

describe('StatusPill', () => {
  describe('Basic Rendering', () => {
    it('renders status label', () => {
      render(<StatusPill status="pending" config={TEST_CONFIG} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders different status labels', () => {
      const { rerender } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();

      rerender(<StatusPill status="approved" config={TEST_CONFIG} />);
      expect(screen.getByText('Approved')).toBeInTheDocument();

      rerender(<StatusPill status="rejected" config={TEST_CONFIG} />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();

      rerender(<StatusPill status="in_progress" config={TEST_CONFIG} />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('renders as inline-flex', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('inline-flex');
    });
  });

  describe('Colors', () => {
    it('applies gray color for pending', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-gray-100');
      expect(pill?.className).toContain('text-gray-600');
    });

    it('applies green color for approved', () => {
      const { container } = render(<StatusPill status="approved" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-green-100');
      expect(pill?.className).toContain('text-green-800');
    });

    it('applies red color for rejected', () => {
      const { container } = render(<StatusPill status="rejected" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-red-100');
      expect(pill?.className).toContain('text-red-800');
    });

    it('applies blue color for in_progress', () => {
      const { container } = render(<StatusPill status="in_progress" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-blue-100');
      expect(pill?.className).toContain('text-blue-800');
    });

    it('applies border classes', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('border');
      expect(pill?.className).toContain('border-gray-200');
    });
  });

  describe('Sizes', () => {
    it('renders small size by default', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('text-xs');
      expect(pill?.className).toContain('px-2');
      expect(pill?.className).toContain('py-0.5');
    });

    it('renders medium size when specified', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} size="md" />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('text-sm');
      expect(pill?.className).toContain('px-2.5');
      expect(pill?.className).toContain('py-1');
    });
  });

  describe('Icons', () => {
    it('renders icon when configured', () => {
      const { container } = render(<StatusPill status="approved" config={TEST_CONFIG} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('does not render icon when not configured', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('renders ReactNode icon', () => {
      const configWithReactNode: StatusPillConfig<'custom'> = {
        custom: {
          label: 'Custom',
          color: 'amber',
          icon: <span data-testid="custom-icon">★</span>,
        },
      };
      render(<StatusPill status="custom" config={configWithReactNode} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Label Visibility', () => {
    it('shows label by default', () => {
      render(<StatusPill status="pending" config={TEST_CONFIG} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<StatusPill status="pending" config={TEST_CONFIG} showLabel={false} />);
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    it('renders icon-only pill when showLabel is false', () => {
      const { container } = render(
        <StatusPill status="approved" config={TEST_CONFIG} showLabel={false} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('adds title attribute with description', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill).toHaveAttribute('title', 'Awaiting action');
    });

    it('has no title when description is not configured', () => {
      const { container } = render(<StatusPill status="in_progress" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill).not.toHaveAttribute('title');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <StatusPill status="pending" config={TEST_CONFIG} className="custom-class" />
      );
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('custom-class');
    });
  });

  describe('Unknown Status Fallback', () => {
    it('renders fallback for unknown status', () => {
      // @ts-expect-error - Testing unknown status handling
      render(<StatusPill status="unknown" config={TEST_CONFIG} />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('uses gray color for unknown status', () => {
      // @ts-expect-error - Testing unknown status handling
      const { container } = render(<StatusPill status="unknown" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('bg-gray-100');
    });
  });

  describe('Styling', () => {
    it('has rounded-full styling', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('rounded-full');
    });

    it('has font-medium styling', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('font-medium');
    });

    it('has whitespace-nowrap styling', () => {
      const { container } = render(<StatusPill status="pending" config={TEST_CONFIG} />);
      const pill = container.querySelector('span');
      expect(pill?.className).toContain('whitespace-nowrap');
    });
  });
});

describe('createStatusPillConfig', () => {
  it('creates a config with proper type inference', () => {
    const config = createStatusPillConfig({
      active: { label: 'Active', color: 'green' },
      inactive: { label: 'Inactive', color: 'gray' },
    });

    expect(config.active.label).toBe('Active');
    expect(config.inactive.color).toBe('gray');
  });
});

describe('getStatusColorClasses', () => {
  it('returns green color classes', () => {
    const classes = getStatusColorClasses('green');
    expect(classes).toContain('bg-green-100');
    expect(classes).toContain('text-green-800');
    expect(classes).toContain('border-green-200');
  });

  it('returns amber color classes', () => {
    const classes = getStatusColorClasses('amber');
    expect(classes).toContain('bg-amber-100');
    expect(classes).toContain('text-amber-800');
  });

  it('returns red color classes', () => {
    const classes = getStatusColorClasses('red');
    expect(classes).toContain('bg-red-100');
    expect(classes).toContain('text-red-800');
  });

  it('returns blue color classes', () => {
    const classes = getStatusColorClasses('blue');
    expect(classes).toContain('bg-blue-100');
    expect(classes).toContain('text-blue-800');
  });

  it('returns gray color classes', () => {
    const classes = getStatusColorClasses('gray');
    expect(classes).toContain('bg-gray-100');
    expect(classes).toContain('text-gray-600');
  });
});

describe('getStatusBorderClass', () => {
  it('returns green border class', () => {
    expect(getStatusBorderClass('green')).toBe('border-l-green-500');
  });

  it('returns amber border class', () => {
    expect(getStatusBorderClass('amber')).toBe('border-l-amber-500');
  });

  it('returns red border class', () => {
    expect(getStatusBorderClass('red')).toBe('border-l-red-500');
  });

  it('returns blue border class', () => {
    expect(getStatusBorderClass('blue')).toBe('border-l-blue-500');
  });

  it('returns gray border class', () => {
    expect(getStatusBorderClass('gray')).toBe('border-l-gray-400');
  });
});
