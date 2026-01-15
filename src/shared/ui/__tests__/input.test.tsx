/**
 * Input Component Tests
 *
 * Tests for the Input component including types, interactions,
 * validation, and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders an input element', () => {
      render(<Input aria-label="test input" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Input aria-label="test input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input');
    });

    it('is wrapped in a container div', () => {
      const { container } = render(<Input aria-label="test input" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper.className).toContain('relative');
    });
  });

  describe('Input Types', () => {
    it('renders text type by default', () => {
      render(<Input aria-label="text input" />);
      const input = screen.getByRole('textbox');
      // HTML inputs default to text if type is not explicitly set
      expect(input.getAttribute('type') || 'text').toBe('text');
    });

    it('renders email type', () => {
      render(<Input type="email" aria-label="email input" />);
      // Email inputs have role textbox
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password type', () => {
      render(<Input type="password" aria-label="password input" />);
      // Password inputs don't have textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('renders number type', () => {
      render(<Input type="number" aria-label="number input" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders search type', () => {
      render(<Input type="search" aria-label="search input" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders tel type', () => {
      render(<Input type="tel" aria-label="phone input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('renders url type', () => {
      render(<Input type="url" aria-label="url input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('User Interactions', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup();
      render(<Input aria-label="text input" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input aria-label="text input" onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when focused', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      render(<Input aria-label="text input" onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when blurred', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();
      render(
        <>
          <Input aria-label="text input" onBlur={handleBlur} />
          <button type="button">Other element</button>
        </>
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.click(screen.getByRole('button'));
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Input aria-label="text input" />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('Controlled and Uncontrolled', () => {
    it('works as controlled input', async () => {
      const user = userEvent.setup();
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            aria-label="controlled input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<ControlledInput />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'controlled');
      expect(input).toHaveValue('controlled');
    });

    it('works as uncontrolled input with defaultValue', () => {
      render(<Input aria-label="uncontrolled input" defaultValue="initial" />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');
    });
  });

  describe('Placeholder', () => {
    it('displays placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Input aria-label="disabled input" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input aria-label="disabled input" disabled />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('Read-Only State', () => {
    it('can be read-only', () => {
      render(<Input aria-label="readonly input" readOnly defaultValue="read only value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });
  });

  describe('Required State', () => {
    it('can be required', () => {
      render(<Input aria-label="required input" required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('Glimmer Effect', () => {
    it('renders without glimmer by default', () => {
      const { container } = render(<Input aria-label="normal input" />);
      // BorderBeam components should not be present
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(1); // Just the input
    });

    it('renders with glimmer effect when enabled', () => {
      const { container } = render(<Input aria-label="glimmer input" glimmer />);
      // Should have input + 2 BorderBeam components
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBeGreaterThan(1);
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Input aria-label="custom input" className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input');
    });

    it('forwards data attributes', () => {
      render(<Input aria-label="test input" data-testid="my-input" />);
      expect(screen.getByTestId('my-input')).toBeInTheDocument();
    });

    it('forwards name attribute', () => {
      render(<Input aria-label="named input" name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });

    it('forwards maxLength attribute', () => {
      render(<Input aria-label="limited input" maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('forwards min and max for number type', () => {
      render(<Input type="number" aria-label="number input" min={0} max={100} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('forwards pattern attribute', () => {
      render(<Input aria-label="pattern input" pattern="[A-Za-z]+" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label="Email address" />);
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <label id="input-label">Username</label>
          <Input aria-labelledby="input-label" />
        </>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-labelledby',
        'input-label'
      );
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Input aria-label="password" aria-describedby="password-help" />
          <span id="password-help">Must be at least 8 characters</span>
        </>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-describedby',
        'password-help'
      );
    });

    it('supports aria-invalid for validation', () => {
      render(<Input aria-label="invalid input" aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports autocomplete attribute', () => {
      render(<Input aria-label="email" autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('Form Integration', () => {
    it('works within a form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input aria-label="form input" name="testField" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'form data');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
