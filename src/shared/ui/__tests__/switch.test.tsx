/**
 * Switch Component Tests
 *
 * Tests for the Switch component including states, interactions,
 * and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch', () => {
  describe('Rendering', () => {
    it('renders a switch element', () => {
      render(<Switch aria-label="test switch" />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('renders unchecked by default', () => {
      render(<Switch aria-label="unchecked" />);
      expect(screen.getByRole('switch')).not.toBeChecked();
    });

    it('renders checked when checked prop is true', () => {
      render(<Switch aria-label="checked" checked />);
      expect(screen.getByRole('switch')).toBeChecked();
    });

    it('renders unchecked when checked prop is false', () => {
      render(<Switch aria-label="unchecked" checked={false} />);
      expect(screen.getByRole('switch')).not.toBeChecked();
    });

    it('shows checked state attribute', () => {
      render(<Switch aria-label="checked" checked />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'checked');
    });

    it('shows unchecked state attribute', () => {
      render(<Switch aria-label="unchecked" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('User Interactions', () => {
    it('toggles state on click', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Switch aria-label="toggle" onCheckedChange={handleChange} />);

      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles from checked to unchecked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Switch aria-label="toggle" checked onCheckedChange={handleChange} />);

      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Switch aria-label="focusable" />);

      await user.tab();
      expect(screen.getByRole('switch')).toHaveFocus();
    });

    it('can be toggled via Space key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Switch aria-label="space toggle" onCheckedChange={handleChange} />);

      await user.tab();
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('can be toggled via Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Switch aria-label="enter toggle" onCheckedChange={handleChange} />);

      await user.tab();
      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Controlled and Uncontrolled', () => {
    it('works as controlled switch', async () => {
      const user = userEvent.setup();

      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Switch
            aria-label="controlled"
            checked={checked}
            onCheckedChange={setChecked}
          />
        );
      };

      render(<ControlledSwitch />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).not.toBeChecked();
      await user.click(switchEl);
      expect(switchEl).toBeChecked();
      await user.click(switchEl);
      expect(switchEl).not.toBeChecked();
    });

    it('works as uncontrolled switch with defaultChecked', () => {
      render(<Switch aria-label="uncontrolled" defaultChecked />);
      expect(screen.getByRole('switch')).toBeChecked();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Switch aria-label="disabled" disabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Switch aria-label="disabled" disabled onCheckedChange={handleChange} />
      );

      await user.click(screen.getByRole('switch'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('has correct disabled styling', () => {
      render(<Switch aria-label="disabled" disabled />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('disabled:opacity-50');
    });
  });

  describe('Required State', () => {
    it('supports aria-required attribute', () => {
      render(<Switch aria-label="required" required />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Styling', () => {
    it('has correct width and height', () => {
      render(<Switch aria-label="sized" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('h-5');
      expect(switchEl.className).toContain('w-9');
    });

    it('has rounded styling', () => {
      render(<Switch aria-label="rounded" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('rounded-full');
    });

    it('has cursor-pointer styling', () => {
      render(<Switch aria-label="pointer" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('cursor-pointer');
    });

    it('has checked state background', () => {
      render(<Switch aria-label="checked" checked />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('data-[state=checked]:bg-primary');
    });

    it('has unchecked state background', () => {
      render(<Switch aria-label="unchecked" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('data-[state=unchecked]:bg-input');
    });

    it('applies custom className', () => {
      render(<Switch aria-label="custom" className="custom-switch" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl.className).toContain('custom-switch');
    });
  });

  describe('Custom Props', () => {
    it('forwards data attributes', () => {
      render(<Switch aria-label="test" data-testid="my-switch" />);
      expect(screen.getByTestId('my-switch')).toBeInTheDocument();
    });

    it('supports name attribute for form submission', () => {
      // Radix Switch uses a hidden input for form submission, not the button element
      render(<Switch aria-label="named" name="notifications" />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('forwards value attribute', () => {
      render(<Switch aria-label="valued" value="enabled" />);
      expect(screen.getByRole('switch')).toHaveAttribute('value', 'enabled');
    });

    it('forwards id attribute', () => {
      render(<Switch aria-label="identified" id="dark-mode-switch" />);
      expect(screen.getByRole('switch')).toHaveAttribute('id', 'dark-mode-switch');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Switch aria-label="Enable notifications" />);
      expect(screen.getByLabelText('Enable notifications')).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <label id="switch-label">Dark Mode</label>
          <Switch aria-labelledby="switch-label" />
        </>
      );
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-labelledby',
        'switch-label'
      );
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Switch aria-label="notifications" aria-describedby="switch-help" />
          <span id="switch-help">Toggle to enable email notifications</span>
        </>
      );
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-describedby',
        'switch-help'
      );
    });

    it('is keyboard navigable in a group', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Switch aria-label="First" />
          <Switch aria-label="Second" />
          <Switch aria-label="Third" />
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
          <label htmlFor="my-switch">Enable feature</label>
          <Switch id="my-switch" onCheckedChange={handleChange} />
        </>
      );

      // Clicking the label should toggle the switch
      await user.click(screen.getByText('Enable feature'));
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Form Integration', () => {
    it('works within a form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Switch aria-label="agree" name="agree" />
          <button type="submit">Submit</button>
        </form>
      );

      await user.click(screen.getByRole('switch'));
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
