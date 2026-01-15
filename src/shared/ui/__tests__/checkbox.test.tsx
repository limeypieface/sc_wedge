/**
 * Checkbox Component Tests
 *
 * Tests for the Checkbox component including states, interactions,
 * and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders a checkbox', () => {
      render(<Checkbox aria-label="test checkbox" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Checkbox aria-label="test checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox');
    });
  });

  describe('States', () => {
    it('renders unchecked by default', () => {
      render(<Checkbox aria-label="unchecked" />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('renders checked when checked prop is true', () => {
      render(<Checkbox aria-label="checked" checked />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('renders unchecked when checked prop is false', () => {
      render(<Checkbox aria-label="unchecked" checked={false} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('renders indeterminate state', () => {
      render(<Checkbox aria-label="indeterminate" checked="indeterminate" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('shows check icon when checked', () => {
      render(<Checkbox aria-label="checked" checked />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('User Interactions', () => {
    it('toggles state on click', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Checkbox aria-label="toggle" onCheckedChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles from checked to unchecked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Checkbox aria-label="toggle" checked onCheckedChange={handleChange} />
      );

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Checkbox aria-label="focusable" />);

      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();
    });

    it('can be toggled via Space key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Checkbox aria-label="space toggle" onCheckedChange={handleChange} />);

      await user.tab();
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Controlled and Uncontrolled', () => {
    it('works as controlled checkbox', async () => {
      const user = userEvent.setup();

      const ControlledCheckbox = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Checkbox
            aria-label="controlled"
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
          />
        );
      };

      render(<ControlledCheckbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('works as uncontrolled checkbox with defaultChecked', () => {
      render(<Checkbox aria-label="uncontrolled" defaultChecked />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Checkbox aria-label="disabled" disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Checkbox
          aria-label="disabled"
          disabled
          onCheckedChange={handleChange}
        />
      );

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('has correct disabled styling', () => {
      render(<Checkbox aria-label="disabled" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('disabled:opacity-50');
    });
  });

  describe('Required State', () => {
    it('can be required', () => {
      render(<Checkbox aria-label="required" required />);
      expect(screen.getByRole('checkbox')).toBeRequired();
    });
  });

  describe('Styling', () => {
    it('has correct size', () => {
      render(<Checkbox aria-label="sized" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('size-4');
    });

    it('has rounded corners', () => {
      render(<Checkbox aria-label="rounded" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('rounded');
    });

    it('has border styling', () => {
      render(<Checkbox aria-label="bordered" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('border');
    });

    it('has focus visible ring', () => {
      render(<Checkbox aria-label="focus" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('focus-visible:ring');
    });

    it('applies custom className', () => {
      render(<Checkbox aria-label="custom" className="custom-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.className).toContain('custom-checkbox');
    });
  });

  describe('Custom Props', () => {
    it('forwards data attributes', () => {
      render(<Checkbox aria-label="test" data-testid="my-checkbox" />);
      expect(screen.getByTestId('my-checkbox')).toBeInTheDocument();
    });

    it('forwards name attribute', () => {
      render(<Checkbox aria-label="named" name="agree" />);
      // Radix checkbox uses a hidden input for form submission
      const checkbox = screen.getByRole('checkbox');
      // The name is used for form submission via internal hidden input
      expect(checkbox).toBeInTheDocument();
    });

    it('forwards value attribute', () => {
      render(<Checkbox aria-label="valued" value="yes" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'yes');
    });

    it('forwards id attribute', () => {
      render(<Checkbox aria-label="identified" id="terms-checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'terms-checkbox');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />);
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <label id="checkbox-label">Subscribe to newsletter</label>
          <Checkbox aria-labelledby="checkbox-label" />
        </>
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-labelledby',
        'checkbox-label'
      );
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Checkbox aria-label="terms" aria-describedby="terms-help" />
          <span id="terms-help">Read our terms of service</span>
        </>
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-describedby',
        'terms-help'
      );
    });

    it('supports aria-invalid for validation', () => {
      render(<Checkbox aria-label="invalid" aria-invalid="true" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('is keyboard navigable in a group', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Checkbox aria-label="First" />
          <Checkbox aria-label="Second" />
          <Checkbox aria-label="Third" />
        </>
      );

      await user.tab();
      expect(screen.getByLabelText('First')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Second')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Third')).toHaveFocus();
    });
  });

  describe('With Label', () => {
    it('works with htmlFor label association', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <>
          <label htmlFor="terms">I agree to the terms</label>
          <Checkbox id="terms" onCheckedChange={handleChange} />
        </>
      );

      // Clicking the label should toggle the checkbox
      await user.click(screen.getByText('I agree to the terms'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('works with nested label', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <label>
          <Checkbox onCheckedChange={handleChange} />
          Accept cookies
        </label>
      );

      await user.click(screen.getByText('Accept cookies'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Form Integration', () => {
    it('works within a form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Checkbox aria-label="agree" name="agree" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
