/**
 * Button Component Tests
 *
 * Tests for the Button component including variants, sizes, interactions,
 * and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button');
    });

    it('renders as button element by default', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button').tagName).toBe('BUTTON');
    });
  });

  describe('Variants', () => {
    it('renders with default variant', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('renders with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
    });

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('bg-background');
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-secondary');
    });

    it('renders with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-accent');
    });

    it('renders with link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('renders with default size', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
    });

    it('renders with sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
    });

    it('renders with lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });

    it('renders with icon size', () => {
      render(<Button size="icon">X</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('size-9');
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('can be activated via Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Enter</Button>);

      await user.tab();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated via Space key', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Space</Button>);

      await user.tab();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not fire click when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has correct disabled styling', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('asChild Prop', () => {
    it('renders as different element with asChild', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/link');
      expect(link.className).toContain('bg-primary');
    });

    it('preserves button styling when asChild', () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link.className).toContain('bg-destructive');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('forwards aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('forwards data attributes', () => {
      render(<Button data-testid="submit-btn">Submit</Button>);
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });

    it('forwards type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );

      await user.tab();
      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Help</Button>
          <span id="help-text">This is help text</span>
        </>
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-describedby',
        'help-text'
      );
    });

    it('has visible focus ring', () => {
      render(<Button>Focus Me</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:ring');
    });
  });

  describe('With Icons', () => {
    it('renders with icon child', () => {
      render(
        <Button>
          <svg data-testid="icon" />
          With Icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'With Icon' })).toBeInTheDocument();
    });

    it('applies icon-specific styling', () => {
      render(
        <Button>
          <svg data-testid="icon" />
          Icon Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('[&_svg]');
    });
  });
});
