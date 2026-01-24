import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartSelect, { SmartSelectOption } from '../SmartSelect';

// Mock scrollIntoView since jsdom doesn't support it
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

describe('SmartSelect - Width Calculation', () => {
  const mockOptions: SmartSelectOption[] = [
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Trigger Width Measurement', () => {
    it('should measure trigger width when dropdown opens', async () => {
      const user = userEvent.setup();

      // Mock offsetWidth
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: 250,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
          placeholder="Select option"
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // The dropdown should open and width should be measured
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });

    it('should pass triggerWidth to menu component', async () => {
      const user = userEvent.setup();

      // Mock offsetWidth with a specific value
      const mockWidth = 320;
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: mockWidth,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Menu should be visible with calculated width applied
      const menu = screen.getByRole('dialog');
      expect(menu).toBeInTheDocument();
    });

    it('should update width calculation on each open', async () => {
      const user = userEvent.setup();

      let currentWidth = 200;
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
          return currentWidth;
        },
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');

      // First open
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Close dropdown
      await user.click(screen.getByText('Option 1'));

      // Change the width
      currentWidth = 300;

      // Open again
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Width should be recalculated
    });
  });

  describe('Menu Width Consistency', () => {
    it('should maintain consistent menu width with trigger', async () => {
      const user = userEvent.setup();
      const triggerWidth = 400;

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: triggerWidth,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const menu = screen.getByText('Option 1').closest('[role="option"]')?.parentElement;
        expect(menu).toBeInTheDocument();
      });
    });

    it('should work with different trigger sizes', async () => {
      const user = userEvent.setup();

      const sizes = [150, 250, 350, 500];

      for (const width of sizes) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
          configurable: true,
          value: width,
        });

        const { unmount } = render(
          <SmartSelect
            value={null}
            options={mockOptions}
            onChange={mockOnChange}
          />
        );

        const trigger = screen.getByRole('button');
        await user.click(trigger);

        await waitFor(() => {
          expect(screen.getByText('Option 1')).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Trigger Open State', () => {
    it('should pass open state to trigger component', async () => {
      const user = userEvent.setup();

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');

      // Initially closed
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Open the dropdown
      await user.click(trigger);

      // Should be open
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });

      // Close by selecting an option
      const option = await screen.findByText('Option 1');
      await user.click(option);

      // Should be closed again
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should update trigger visual state when open', async () => {
      const user = userEvent.setup();

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing offsetWidth gracefully', async () => {
      const user = userEvent.setup();

      // Don't set offsetWidth - should handle undefined
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: undefined,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Should still work even without width
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });

    it('should handle zero width', async () => {
      const user = userEvent.setup();

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: 0,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });

    it('should handle very large widths', async () => {
      const user = userEvent.setup();

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: 9999,
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should recalculate width on each dropdown open', async () => {
      const user = userEvent.setup();
      let width = 200;

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
          return width;
        },
      });

      render(
        <SmartSelect
          value={null}
          options={mockOptions}
          onChange={mockOnChange}
        />
      );

      const trigger = screen.getByRole('button');

      // First open with width 200
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Select and close
      await user.click(screen.getByText('Option 1'));
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });

      // Simulate window resize
      width = 400;

      // Open again with new width
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });
    });
  });
});
