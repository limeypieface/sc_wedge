/**
 * Popover Component Tests
 *
 * Tests for the Popover component including trigger behavior,
 * content positioning, and accessibility features.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from '../popover';

describe('Popover', () => {
  describe('Basic Rendering', () => {
    it('renders trigger element', () => {
      render(
        <Popover>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Open popover')).toBeInTheDocument();
    });

    it('does not show content initially', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Hidden content</PopoverContent>
        </Popover>
      );
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('trigger has data-slot attribute', () => {
      render(
        <Popover>
          <PopoverTrigger data-testid="trigger">Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'popover-trigger');
    });
  });

  describe('Click Behavior', () => {
    it('shows content on click', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Click me</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Click me'));
      await waitFor(() => {
        expect(screen.getByText('Popover content')).toBeInTheDocument();
      });
    });

    it('hides content on second click', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('hides content when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>
          <button type="button">Outside</button>
        </div>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Outside'));
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Controlled Mode', () => {
    it('shows content when open is true', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Always visible</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Always visible')).toBeInTheDocument();
    });

    it('hides content when open is false', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Never visible</PopoverContent>
        </Popover>
      );
      expect(screen.queryByText('Never visible')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when state changes', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Content Styling', () => {
    it('content has proper background', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">Styled content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('bg-popover');
      });
    });

    it('content has border', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('border');
      });
    });

    it('content has shadow', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('shadow-md');
      });
    });

    it('content has rounded corners', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('rounded-md');
      });
    });

    it('applies custom className to content', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent className="custom-popover" data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('custom-popover');
      });
    });
  });

  describe('Content Positioning', () => {
    it('content has data-slot attribute', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveAttribute('data-slot', 'popover-content');
      });
    });
  });

  describe('Trigger Types', () => {
    it('works with button trigger', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Button Trigger</button>
          </PopoverTrigger>
          <PopoverContent>Button popover</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Button Trigger' }));
      await waitFor(() => {
        expect(screen.getByText('Button popover')).toBeInTheDocument();
      });
    });
  });

  describe('PopoverAnchor', () => {
    it('renders anchor with data-slot attribute', () => {
      render(
        <Popover>
          <PopoverAnchor data-testid="anchor">
            <span>Anchor content</span>
          </PopoverAnchor>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-slot', 'popover-anchor');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Keyboard content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Keyboard content')).toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Trigger'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Complex Content', () => {
    it('renders form elements inside popover', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open Form</PopoverTrigger>
          <PopoverContent>
            <form>
              <label htmlFor="name">Name</label>
              <input id="name" type="text" />
              <button type="submit">Submit</button>
            </form>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open Form'));
      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      });
    });
  });
});
