/**
 * Badge Component Tests
 *
 * Tests for the Badge component including variants, composition,
 * and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Badge>Test</Badge>);
      expect(screen.getByText('Test')).toHaveAttribute('data-slot', 'badge');
    });

    it('renders as span element by default', () => {
      render(<Badge>Test</Badge>);
      expect(screen.getByText('Test').tagName).toBe('SPAN');
    });
  });

  describe('Variants', () => {
    it('renders with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge.className).toContain('bg-primary');
    });

    it('renders with secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge.className).toContain('bg-secondary');
    });

    it('renders with destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge.className).toContain('bg-destructive');
    });

    it('renders with outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge.className).toContain('text-foreground');
    });
  });

  describe('asChild Prop', () => {
    it('renders as different element with asChild', () => {
      render(
        <Badge asChild>
          <a href="/new">New Feature</a>
        </Badge>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/new');
      expect(link.className).toContain('bg-primary');
    });

    it('preserves badge styling when asChild', () => {
      render(
        <Badge asChild variant="destructive">
          <button type="button">Click</button>
        </Badge>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge.className).toContain('custom-badge');
    });

    it('merges custom className with variant classes', () => {
      render(
        <Badge variant="secondary" className="extra-padding">
          Merged
        </Badge>
      );
      const badge = screen.getByText('Merged');
      expect(badge.className).toContain('bg-secondary');
      expect(badge.className).toContain('extra-padding');
    });

    it('forwards data attributes', () => {
      render(<Badge data-testid="status-badge">Active</Badge>);
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    });

    it('forwards aria attributes', () => {
      render(<Badge aria-label="3 new notifications">3</Badge>);
      expect(screen.getByLabelText('3 new notifications')).toBeInTheDocument();
    });
  });

  describe('Content Types', () => {
    it('renders with text content', () => {
      render(<Badge>Status: Active</Badge>);
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
    });

    it('renders with numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icon content', () => {
      render(
        <Badge>
          <svg data-testid="badge-icon" />
          New
        </Badge>
      );
      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with only icon', () => {
      render(
        <Badge aria-label="Status indicator">
          <svg data-testid="status-icon" />
        </Badge>
      );
      expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has rounded corners', () => {
      render(<Badge>Rounded</Badge>);
      const badge = screen.getByText('Rounded');
      expect(badge.className).toContain('rounded-md');
    });

    it('has proper text size', () => {
      render(<Badge>Small Text</Badge>);
      const badge = screen.getByText('Small Text');
      expect(badge.className).toContain('text-xs');
    });

    it('has border styling', () => {
      render(<Badge>Bordered</Badge>);
      const badge = screen.getByText('Bordered');
      expect(badge.className).toContain('border');
    });

    it('handles overflow', () => {
      render(<Badge>Very long badge text that might overflow</Badge>);
      const badge = screen.getByText('Very long badge text that might overflow');
      expect(badge.className).toContain('overflow-hidden');
    });

    it('prevents text wrapping', () => {
      render(<Badge>No wrap</Badge>);
      const badge = screen.getByText('No wrap');
      expect(badge.className).toContain('whitespace-nowrap');
    });
  });

  describe('Interactive Badges (via asChild)', () => {
    it('can be made clickable', async () => {
      const handleClick = jest.fn();
      render(
        <Badge asChild>
          <button type="button" onClick={handleClick}>
            Clickable
          </button>
        </Badge>
      );

      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be made into a link', () => {
      render(
        <Badge asChild>
          <a href="/details">View Details</a>
        </Badge>
      );

      expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
        'href',
        '/details'
      );
    });
  });

  describe('Accessibility', () => {
    it('has appropriate role when needed', () => {
      render(<Badge role="status">Processing</Badge>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('supports screen reader text', () => {
      render(
        <Badge>
          <span className="sr-only">Status: </span>Active
        </Badge>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('has visible focus ring on interactive badges', () => {
      render(
        <Badge asChild>
          <button type="button">Focus Me</button>
        </Badge>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:ring');
    });
  });
});
