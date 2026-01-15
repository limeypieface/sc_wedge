/**
 * SlidePanel Component Tests
 *
 * Tests for the SlidePanel component including open/close behavior,
 * positioning, keyboard navigation, and accessibility.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlidePanel, SlidePanelSection } from '../slide-panel';

describe('SlidePanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Panel content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<SlidePanel {...defaultProps} />);
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<SlidePanel {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      render(<SlidePanel {...defaultProps} title="Panel Title" />);
      expect(screen.getByText('Panel Title')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<SlidePanel {...defaultProps} subtitle="Panel subtitle" />);
      expect(screen.getByText('Panel subtitle')).toBeInTheDocument();
    });

    it('renders header actions', () => {
      render(
        <SlidePanel
          {...defaultProps}
          headerActions={<button type="button">Action</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('renders footer', () => {
      render(
        <SlidePanel {...defaultProps} footer={<div>Footer content</div>} />
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<SlidePanel {...defaultProps} onClose={handleClose} />);

      // Find the close button (has X icon)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (closeButton) {
        await user.click(closeButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = render(
        <SlidePanel {...defaultProps} onClose={handleClose} />
      );

      // Click the overlay (first absolute div with bg-black)
      const overlay = container.querySelector('.bg-black\\/50');
      if (overlay) {
        await user.click(overlay);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = render(
        <SlidePanel
          {...defaultProps}
          onClose={handleClose}
          closeOnOverlayClick={false}
        />
      );

      const overlay = container.querySelector('.bg-black\\/50');
      if (overlay) {
        await user.click(overlay);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });

    it('calls onClose on Escape key', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<SlidePanel {...defaultProps} onClose={handleClose} />);

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <SlidePanel
          {...defaultProps}
          onClose={handleClose}
          closeOnEscape={false}
        />
      );

      await user.keyboard('{Escape}');
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Positioning', () => {
    it('positions on right side by default', () => {
      const { container } = render(<SlidePanel {...defaultProps} />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('right-0');
    });

    it('positions on left side when specified', () => {
      const { container } = render(<SlidePanel {...defaultProps} side="left" />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('left-0');
    });
  });

  describe('Width Variants', () => {
    it('renders medium width by default', () => {
      const { container } = render(<SlidePanel {...defaultProps} />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('max-w-md');
    });

    it('renders small width', () => {
      const { container } = render(<SlidePanel {...defaultProps} width="sm" />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('max-w-sm');
    });

    it('renders large width', () => {
      const { container } = render(<SlidePanel {...defaultProps} width="lg" />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('max-w-lg');
    });

    it('renders extra large width', () => {
      const { container } = render(<SlidePanel {...defaultProps} width="xl" />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('max-w-xl');
    });

    it('renders full width', () => {
      const { container } = render(<SlidePanel {...defaultProps} width="full" />);
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('max-w-full');
    });
  });

  describe('Overlay', () => {
    it('shows overlay by default', () => {
      const { container } = render(<SlidePanel {...defaultProps} />);
      expect(container.querySelector('.bg-black\\/50')).toBeInTheDocument();
    });

    it('hides overlay when showOverlay is false', () => {
      const { container } = render(
        <SlidePanel {...defaultProps} showOverlay={false} />
      );
      expect(container.querySelector('.bg-black\\/50')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className to panel', () => {
      const { container } = render(
        <SlidePanel {...defaultProps} className="custom-panel" />
      );
      const panel = container.querySelector('.bg-background');
      expect(panel?.className).toContain('custom-panel');
    });

    it('applies custom contentClassName to content', () => {
      const { container } = render(
        <SlidePanel {...defaultProps} contentClassName="custom-content" />
      );
      const content = container.querySelector('.overflow-y-auto');
      expect(content?.className).toContain('custom-content');
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when open', () => {
      render(<SlidePanel {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<SlidePanel {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<SlidePanel {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });
});

describe('SlidePanelSection', () => {
  it('renders children', () => {
    render(
      <SlidePanelSection>
        <div>Section content</div>
      </SlidePanelSection>
    );
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <SlidePanelSection title="Section Title">
        <div>Content</div>
      </SlidePanelSection>
    );
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('applies margin-bottom styling', () => {
    const { container } = render(
      <SlidePanelSection>
        <div>Content</div>
      </SlidePanelSection>
    );
    expect(container.firstChild?.className).toContain('mb-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SlidePanelSection className="custom-section">
        <div>Content</div>
      </SlidePanelSection>
    );
    expect(container.firstChild?.className).toContain('custom-section');
  });
});
