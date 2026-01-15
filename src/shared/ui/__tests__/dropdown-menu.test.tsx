/**
 * DropdownMenu Component Tests
 *
 * Tests for the DropdownMenu component including trigger behavior,
 * items, keyboard navigation, and accessibility features.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  describe('Basic Rendering', () => {
    it('renders trigger element', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText('Open menu')).toBeInTheDocument();
    });

    it('does not show content initially', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Hidden item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.queryByText('Hidden item')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('shows content on click', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open menu'));
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Item')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Item')).not.toBeInTheDocument();
      });
    });

    it('closes when item is selected', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Select me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Select me')).toBeInTheDocument();
      });

      // Selecting an item should close the menu
      await user.click(screen.getByText('Select me'));
      await waitFor(() => {
        expect(screen.queryByText('Select me')).not.toBeInTheDocument();
      });
    });
  });

  describe('DropdownMenuItem', () => {
    it('renders menu items', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });
    });

    it('calls onSelect when item is clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Click me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Click me')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Click me'));
      expect(handleSelect).toHaveBeenCalled();
    });

    it('disabled item cannot be selected', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onSelect={handleSelect}>
              Disabled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Disabled'));
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox items', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>Show toolbar</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Show toolbar')).toBeInTheDocument();
      });
    });

    it('calls onCheckedChange when toggled', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem onCheckedChange={handleCheckedChange}>
              Toggle
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Toggle')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Toggle'));
      expect(handleCheckedChange).toHaveBeenCalled();
    });
  });

  describe('DropdownMenuRadioGroup', () => {
    it('renders radio items', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
      });
    });

    it('calls onValueChange when selection changes', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={handleValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Option 2'));
      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('label has semibold font', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel data-testid="label">Label</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('label').className).toContain('font-semibold');
      });
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('separator')).toBeInTheDocument();
      });
    });

    it('separator has muted background', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('separator').className).toContain('bg-muted');
      });
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut text', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Copy
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('⌘C')).toBeInTheDocument();
      });
    });

    it('shortcut has tracking-widest class', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Paste
              <DropdownMenuShortcut data-testid="shortcut">⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('shortcut').className).toContain('tracking-widest');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Item')).toBeInTheDocument();
      });
    });

    it('navigates items with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      // Navigate through items
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
    });
  });

  describe('Content Styling', () => {
    it('content has proper background', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content').className).toContain('bg-popover');
      });
    });

    it('content has rounded corners', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content').className).toContain('rounded-md');
      });
    });

    it('content has shadow', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('content').className).toContain('shadow-md');
      });
    });
  });
});
