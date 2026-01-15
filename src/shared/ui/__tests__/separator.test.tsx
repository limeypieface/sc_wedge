/**
 * Separator Component Tests
 *
 * Tests for the Separator component including orientation,
 * decoration mode, and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator', () => {
  describe('Rendering', () => {
    it('renders a separator element', () => {
      render(<Separator data-testid="separator" />);
      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Separator data-testid="separator" />);
      expect(screen.getByTestId('separator')).toHaveAttribute('data-slot', 'separator');
    });
  });

  describe('Orientation', () => {
    it('renders horizontal by default', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('renders horizontal orientation explicitly', () => {
      render(<Separator data-testid="separator" orientation="horizontal" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('renders vertical orientation', () => {
      render(<Separator data-testid="separator" orientation="vertical" />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
    });

    it('has correct horizontal styling', () => {
      render(<Separator data-testid="separator" orientation="horizontal" />);
      const separator = screen.getByTestId('separator');
      expect(separator.className).toContain('data-[orientation=horizontal]:h-px');
      expect(separator.className).toContain('data-[orientation=horizontal]:w-full');
    });

    it('has correct vertical styling', () => {
      render(<Separator data-testid="separator" orientation="vertical" />);
      const separator = screen.getByTestId('separator');
      expect(separator.className).toContain('data-[orientation=vertical]:h-full');
      expect(separator.className).toContain('data-[orientation=vertical]:w-px');
    });
  });

  describe('Decorative Mode', () => {
    it('is decorative by default', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      // Decorative separators have role="none" in Radix
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('is decorative when explicitly set', () => {
      render(<Separator data-testid="separator" decorative={true} />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('is semantic separator when not decorative', () => {
      render(<Separator data-testid="separator" decorative={false} />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });

  describe('Styling', () => {
    it('has background color', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator.className).toContain('bg-border');
    });

    it('is non-shrinkable', () => {
      render(<Separator data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator.className).toContain('shrink-0');
    });

    it('applies custom className', () => {
      render(<Separator data-testid="separator" className="my-custom-separator" />);
      const separator = screen.getByTestId('separator');
      expect(separator.className).toContain('my-custom-separator');
    });
  });

  describe('Custom Props', () => {
    it('forwards data attributes', () => {
      render(<Separator data-testid="my-separator" />);
      expect(screen.getByTestId('my-separator')).toBeInTheDocument();
    });

    it('forwards id attribute', () => {
      render(<Separator data-testid="separator" id="section-divider" />);
      expect(screen.getByTestId('separator')).toHaveAttribute('id', 'section-divider');
    });
  });

  describe('Usage Patterns', () => {
    it('works as horizontal divider between content', () => {
      render(
        <div>
          <p>Content above</p>
          <Separator data-testid="separator" />
          <p>Content below</p>
        </div>
      );
      expect(screen.getByText('Content above')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Content below')).toBeInTheDocument();
    });

    it('works as vertical divider in flex container', () => {
      render(
        <div style={{ display: 'flex', height: '50px' }}>
          <span>Left</span>
          <Separator data-testid="separator" orientation="vertical" />
          <span>Right</span>
        </div>
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is accessible as decorative element', () => {
      render(<Separator data-testid="separator" decorative={true} />);
      const separator = screen.getByTestId('separator');
      // Decorative separators should have role="none" to hide from AT
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('is accessible as semantic separator', () => {
      render(<Separator data-testid="separator" decorative={false} />);
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('role', 'separator');
    });

    it('supports aria-orientation for semantic separators', () => {
      render(
        <Separator data-testid="separator" decorative={false} orientation="vertical" />
      );
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });
  });
});
