/**
 * Label Component Tests
 *
 * Tests for the Label component including rendering, styling,
 * form association, and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Label } from '../label';

describe('Label', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Label>Username</Label>);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Label>Test</Label>);
      expect(screen.getByText('Test')).toHaveAttribute('data-slot', 'label');
    });

    it('renders as label element', () => {
      render(<Label>Test</Label>);
      expect(screen.getByText('Test').tagName).toBe('LABEL');
    });
  });

  describe('Form Association', () => {
    it('associates with input via htmlFor', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Label htmlFor="username">Username</Label>
          <input id="username" data-testid="input" />
        </>
      );

      // Clicking label should focus the input
      await user.click(screen.getByText('Username'));
      expect(screen.getByTestId('input')).toHaveFocus();
    });

    it('forwards htmlFor attribute', () => {
      render(<Label htmlFor="email">Email</Label>);
      expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
    });
  });

  describe('Styling', () => {
    it('has flex layout', () => {
      render(<Label>Flex Label</Label>);
      const label = screen.getByText('Flex Label');
      expect(label.className).toContain('flex');
    });

    it('has proper text size', () => {
      render(<Label>Small Text</Label>);
      const label = screen.getByText('Small Text');
      expect(label.className).toContain('text-sm');
    });

    it('has items centered', () => {
      render(<Label>Centered</Label>);
      const label = screen.getByText('Centered');
      expect(label.className).toContain('items-center');
    });

    it('has gap for icon support', () => {
      render(<Label>With Gap</Label>);
      const label = screen.getByText('With Gap');
      expect(label.className).toContain('gap-2');
    });

    it('is not selectable', () => {
      render(<Label>Not Selectable</Label>);
      const label = screen.getByText('Not Selectable');
      expect(label.className).toContain('select-none');
    });

    it('applies custom className', () => {
      render(<Label className="custom-label">Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label.className).toContain('custom-label');
    });
  });

  describe('Disabled State Styling', () => {
    it('has peer-disabled styling for associated inputs', () => {
      render(<Label>Peer Disabled</Label>);
      const label = screen.getByText('Peer Disabled');
      expect(label.className).toContain('peer-disabled:opacity-50');
    });

    it('has group-data-disabled styling', () => {
      render(<Label>Group Disabled</Label>);
      const label = screen.getByText('Group Disabled');
      expect(label.className).toContain('group-data-[disabled=true]:opacity-50');
    });
  });

  describe('With Icons', () => {
    it('renders with icon child', () => {
      render(
        <Label>
          <svg data-testid="icon" />
          With Icon
        </Label>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('maintains gap between icon and text', () => {
      render(
        <Label>
          <svg data-testid="icon" />
          Spaced
        </Label>
      );
      const label = screen.getByText('Spaced').closest('label');
      expect(label?.className).toContain('gap-2');
    });
  });

  describe('Custom Props', () => {
    it('forwards data attributes', () => {
      render(<Label data-testid="my-label">Test</Label>);
      expect(screen.getByTestId('my-label')).toBeInTheDocument();
    });

    it('forwards id attribute', () => {
      render(<Label id="label-id">ID Label</Label>);
      expect(screen.getByText('ID Label')).toHaveAttribute('id', 'label-id');
    });

    it('forwards aria attributes', () => {
      render(<Label aria-describedby="help">Described</Label>);
      expect(screen.getByText('Described')).toHaveAttribute(
        'aria-describedby',
        'help'
      );
    });
  });

  describe('Accessibility', () => {
    it('can be clicked to focus associated input', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Label htmlFor="test-input">Click Me</Label>
          <input id="test-input" />
        </>
      );

      await user.click(screen.getByText('Click Me'));
      expect(document.getElementById('test-input')).toHaveFocus();
    });

    it('works with nested input (implicit association)', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();

      render(
        <Label>
          Nested Input
          <input data-testid="nested-input" onFocus={handleFocus} />
        </Label>
      );

      await user.click(screen.getByText('Nested Input'));
      expect(handleFocus).toHaveBeenCalled();
    });
  });

  describe('Required Indicator', () => {
    it('can display required indicator', () => {
      render(
        <Label>
          Email
          <span className="text-destructive">*</span>
        </Label>
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('With Form Controls', () => {
    it('works with checkbox', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Label>
          <input type="checkbox" onChange={handleChange} />
          Accept terms
        </Label>
      );

      await user.click(screen.getByText('Accept terms'));
      expect(handleChange).toHaveBeenCalled();
    });

    it('works with radio button', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Label>
          <input type="radio" name="option" onChange={handleChange} />
          Option A
        </Label>
      );

      await user.click(screen.getByText('Option A'));
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
