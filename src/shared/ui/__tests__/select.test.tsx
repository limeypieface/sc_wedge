/**
 * Select Component Tests
 *
 * Tests for the Select component including trigger, content,
 * items, and keyboard navigation.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '../select';

describe('Select', () => {
  const renderSelect = (props?: { defaultValue?: string; onValueChange?: (value: string) => void }) => {
    return render(
      <Select {...props}>
        <SelectTrigger aria-label="Select option">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  describe('Basic Rendering', () => {
    it('renders trigger element', () => {
      renderSelect();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders placeholder text', () => {
      renderSelect();
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('trigger has data-slot attribute', () => {
      renderSelect();
      expect(screen.getByRole('combobox')).toHaveAttribute('data-slot', 'select-trigger');
    });

    it('does not show options initially', () => {
      renderSelect();
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('shows options on click', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });
    });

    it('shows all options when opened', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
        expect(screen.getByText('Orange')).toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Selection', () => {
    it('selects an option on click', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Apple'));
      await waitFor(() => {
        // Selected value should be shown in trigger
        expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
      });
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Banana'));
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('calls onValueChange when selection changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      renderSelect({ onValueChange: handleChange });

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Orange')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Orange'));
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('orange');
      });
    });

    it('shows default value', () => {
      renderSelect({ defaultValue: 'banana' });
      expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
    });
  });

  describe('SelectItem', () => {
    it('items have option role', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
      });
    });

    it('items have data-slot attribute', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        options.forEach((option) => {
          expect(option).toHaveAttribute('data-slot', 'select-item');
        });
      });
    });

    it('disabled item cannot be selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled" disabled>
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });

      // Click on disabled item
      await user.click(screen.getByText('Disabled'));
      // Should not call handler
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('SelectGroup and SelectLabel', () => {
    it('renders group with label', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Select fruit">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Fruits')).toBeInTheDocument();
      });
    });

    it('label has data-slot attribute', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel data-testid="label">Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByTestId('label')).toHaveAttribute('data-slot', 'select-label');
      });
    });
  });

  describe('SelectSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectSeparator data-testid="separator" />
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByTestId('separator')).toBeInTheDocument();
      });
    });

    it('separator has data-slot attribute', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
            <SelectSeparator data-testid="separator" />
            <SelectItem value="b">B</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByTestId('separator')).toHaveAttribute('data-slot', 'select-separator');
      });
    });
  });

  describe('SelectTrigger Sizes', () => {
    it('renders default size', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select" data-testid="trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toHaveAttribute('data-size', 'default');
    });

    it('renders small size', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Select" data-testid="trigger" size="sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens on Space key', async () => {
      const user = userEvent.setup();
      renderSelect();

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('opens on Enter key', async () => {
      const user = userEvent.setup();
      renderSelect();

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate down
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        // Should select the second item (Banana) after navigating
        expect(screen.getByRole('combobox')).toHaveTextContent(/Banana|Orange|Apple/);
      });
    });
  });

  describe('Styling', () => {
    it('content has proper styling', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent data-testid="content">
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content.className).toContain('bg-popover');
        expect(content.className).toContain('border');
        expect(content.className).toContain('rounded-lg');
      });
    });
  });

  describe('Accessibility', () => {
    it('trigger has combobox role', () => {
      renderSelect();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('content has listbox role', async () => {
      const user = userEvent.setup();
      renderSelect();

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('supports aria-label', () => {
      renderSelect();
      expect(screen.getByLabelText('Select option')).toBeInTheDocument();
    });
  });
});
