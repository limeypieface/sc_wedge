/**
 * Textarea Component Tests
 *
 * Tests for the Textarea component including rendering, interactions,
 * and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders a textarea element', () => {
      render(<Textarea aria-label="test textarea" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Textarea aria-label="test textarea" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea');
    });

    it('is wrapped in a container div', () => {
      const { container } = render(<Textarea aria-label="test textarea" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper.className).toContain('relative');
    });
  });

  describe('User Interactions', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup();
      render(<Textarea aria-label="text input" />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');
      expect(textarea).toHaveValue('Hello World');
    });

    it('accepts multiline text', async () => {
      const user = userEvent.setup();
      render(<Textarea aria-label="multiline input" />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3');
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });

    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Textarea aria-label="text input" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when focused', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      render(<Textarea aria-label="text input" onFocus={handleFocus} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when blurred', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();
      render(
        <>
          <Textarea aria-label="text input" onBlur={handleBlur} />
          <button type="button">Other element</button>
        </>
      );

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.click(screen.getByRole('button'));
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Textarea aria-label="text input" />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('Controlled and Uncontrolled', () => {
    it('works as controlled textarea', async () => {
      const user = userEvent.setup();
      const ControlledTextarea = () => {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            aria-label="controlled input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<ControlledTextarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'controlled text');
      expect(textarea).toHaveValue('controlled text');
    });

    it('works as uncontrolled textarea with defaultValue', () => {
      render(<Textarea aria-label="uncontrolled input" defaultValue="initial value" />);
      expect(screen.getByRole('textbox')).toHaveValue('initial value');
    });
  });

  describe('Placeholder', () => {
    it('displays placeholder text', () => {
      render(<Textarea placeholder="Enter your message..." />);
      expect(screen.getByPlaceholderText('Enter your message...')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Textarea aria-label="disabled textarea" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Textarea aria-label="disabled textarea" disabled />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      expect(textarea).toHaveValue('');
    });
  });

  describe('Read-Only State', () => {
    it('can be read-only', () => {
      render(
        <Textarea aria-label="readonly textarea" readOnly defaultValue="read only value" />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readonly');
    });
  });

  describe('Required State', () => {
    it('can be required', () => {
      render(<Textarea aria-label="required textarea" required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('Rows and Sizing', () => {
    it('accepts rows attribute', () => {
      render(<Textarea aria-label="rows textarea" rows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('has minimum height styling', () => {
      render(<Textarea aria-label="min-height" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('min-h-16');
    });
  });

  describe('Glimmer Effect', () => {
    it('renders without glimmer by default', () => {
      const { container } = render(<Textarea aria-label="normal textarea" />);
      // BorderBeam components should not be present
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(1); // Just the textarea
    });

    it('renders with glimmer effect when enabled', () => {
      const { container } = render(<Textarea aria-label="glimmer textarea" glimmer />);
      // Should have textarea + 2 BorderBeam components
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBeGreaterThan(1);
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Textarea aria-label="custom textarea" className="custom-textarea" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('custom-textarea');
    });

    it('forwards data attributes', () => {
      render(<Textarea aria-label="test textarea" data-testid="my-textarea" />);
      expect(screen.getByTestId('my-textarea')).toBeInTheDocument();
    });

    it('forwards name attribute', () => {
      render(<Textarea aria-label="named textarea" name="message" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'message');
    });

    it('forwards maxLength attribute', () => {
      render(<Textarea aria-label="limited textarea" maxLength={500} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500');
    });

    it('forwards cols attribute', () => {
      render(<Textarea aria-label="cols textarea" cols={50} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('cols', '50');
    });

    it('forwards wrap attribute', () => {
      render(<Textarea aria-label="wrap textarea" wrap="hard" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('wrap', 'hard');
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Textarea aria-label="Message content" />);
      expect(screen.getByLabelText('Message content')).toBeInTheDocument();
    });

    it('supports aria-labelledby', () => {
      render(
        <>
          <label id="textarea-label">Description</label>
          <Textarea aria-labelledby="textarea-label" />
        </>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-labelledby',
        'textarea-label'
      );
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Textarea aria-label="message" aria-describedby="message-help" />
          <span id="message-help">Enter a detailed message</span>
        </>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-describedby',
        'message-help'
      );
    });

    it('supports aria-invalid for validation', () => {
      render(<Textarea aria-label="invalid textarea" aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Form Integration', () => {
    it('works within a form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Textarea aria-label="form textarea" name="message" />
          <button type="submit">Submit</button>
        </form>
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Form message content');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Character Counting', () => {
    it('can track character count', async () => {
      const user = userEvent.setup();

      const TextareaWithCount = () => {
        const [value, setValue] = React.useState('');
        return (
          <>
            <Textarea
              aria-label="counted"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={100}
            />
            <span data-testid="char-count">{value.length}/100</span>
          </>
        );
      };

      render(<TextareaWithCount />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(screen.getByTestId('char-count')).toHaveTextContent('5/100');
    });
  });
});
