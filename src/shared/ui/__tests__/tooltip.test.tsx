/**
 * Tooltip Component Tests
 *
 * Tests for the Tooltip component including trigger behavior,
 * content display, and accessibility features.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';

// Helper to wrap tooltips with no delay for reliable testing
const renderTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
};

describe('Tooltip', () => {
  describe('Basic Rendering', () => {
    it('renders trigger element', () => {
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('does not show content initially', () => {
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Hidden content</TooltipContent>
        </Tooltip>
      );
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('trigger has data-slot attribute', () => {
      renderTooltip(
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      );
      expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'tooltip-trigger');
    });
  });

  describe('Hover Behavior', () => {
    it('shows content on hover', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Hover me'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('hides content when controlled open is false', () => {
      // Test controlled hiding behavior instead of unhover (more reliable in jsdom)
      const { rerender } = renderTooltip(
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      );

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      rerender(
        <TooltipProvider delayDuration={0}>
          <Tooltip open={false}>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Controlled Mode', () => {
    it('shows content when open is true', () => {
      renderTooltip(
        <Tooltip open>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Always visible</TooltipContent>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('hides content when open is false', () => {
      renderTooltip(
        <Tooltip open={false}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Never visible</TooltipContent>
        </Tooltip>
      );
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when state changes', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      renderTooltip(
        <Tooltip onOpenChange={handleOpenChange}>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));
      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className to content', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="custom-tooltip" data-testid="content">
            Content
          </TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('custom-tooltip');
      });
    });

    it('forwards data attributes to trigger', () => {
      renderTooltip(
        <Tooltip>
          <TooltipTrigger data-testid="my-trigger">Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      );
      expect(screen.getByTestId('my-trigger')).toBeInTheDocument();
    });
  });

  describe('Trigger Types', () => {
    it('works with button trigger', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Button Trigger</button>
          </TooltipTrigger>
          <TooltipContent>Button tooltip</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button', { name: 'Button Trigger' }));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('works with icon trigger', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>
            <svg data-testid="icon" />
          </TooltipTrigger>
          <TooltipContent>Icon tooltip</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByTestId('icon'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Content Styling', () => {
    it('content has proper background', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent data-testid="content">Styled content</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('bg-foreground');
      });
    });

    it('content has proper text styling', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent data-testid="content">Text content</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('text-xs');
      });
    });

    it('content has rounded corners', async () => {
      const user = userEvent.setup();
      renderTooltip(
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent data-testid="content">Rounded content</TooltipContent>
        </Tooltip>
      );

      await user.hover(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('rounded-md');
      });
    });
  });
});

describe('TooltipProvider', () => {
  it('can configure delay duration', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Delayed trigger</TooltipTrigger>
          <TooltipContent>Delayed content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    await user.hover(screen.getByText('Delayed trigger'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('can wrap multiple tooltips', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <div>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
            <TooltipContent>First tooltip content</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
            <TooltipContent>Second tooltip content</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );

    await user.hover(screen.getByText('First'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('First tooltip content');
    });
  });
});

describe('Accessibility', () => {
  it('content has tooltip role when visible', async () => {
    const user = userEvent.setup();
    renderTooltip(
      <Tooltip>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Accessible content</TooltipContent>
      </Tooltip>
    );

    await user.hover(screen.getByText('Trigger'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('trigger has aria-describedby when tooltip is open', async () => {
    const user = userEvent.setup();
    renderTooltip(
      <Tooltip>
        <TooltipTrigger data-testid="trigger">Trigger</TooltipTrigger>
        <TooltipContent>Description text</TooltipContent>
      </Tooltip>
    );

    await user.hover(screen.getByTestId('trigger'));
    await waitFor(() => {
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('aria-describedby');
    });
  });
});
