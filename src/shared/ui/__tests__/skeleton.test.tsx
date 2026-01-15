/**
 * Skeleton Component Tests
 *
 * Tests for the Skeleton loading placeholder component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('renders a div element', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton').tagName).toBe('DIV');
    });

    it('renders with children', () => {
      render(
        <Skeleton>
          <span data-testid="child">Loading...</span>
        </Skeleton>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has animate-pulse class', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton').className).toContain('animate-pulse');
    });

    it('has rounded-md class', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton').className).toContain('rounded-md');
    });

    it('has muted background', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton').className).toContain('bg-muted');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Skeleton data-testid="skeleton" className="w-full h-10" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.className).toContain('w-full');
      expect(skeleton.className).toContain('h-10');
    });

    it('merges custom className with default classes', () => {
      render(<Skeleton data-testid="skeleton" className="custom-class" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.className).toContain('animate-pulse');
      expect(skeleton.className).toContain('custom-class');
    });

    it('forwards data attributes', () => {
      render(<Skeleton data-testid="my-skeleton" data-loading="true" />);
      expect(screen.getByTestId('my-skeleton')).toHaveAttribute('data-loading', 'true');
    });

    it('forwards id attribute', () => {
      render(<Skeleton data-testid="skeleton" id="loading-indicator" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('id', 'loading-indicator');
    });

    it('forwards role attribute', () => {
      render(<Skeleton data-testid="skeleton" role="status" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('role', 'status');
    });

    it('forwards aria-label', () => {
      render(<Skeleton data-testid="skeleton" aria-label="Loading content" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Usage Patterns', () => {
    it('can be used as text placeholder', () => {
      render(<Skeleton data-testid="text" className="h-4 w-[250px]" />);
      const skeleton = screen.getByTestId('text');
      expect(skeleton.className).toContain('h-4');
      expect(skeleton.className).toContain('w-[250px]');
    });

    it('can be used as avatar placeholder', () => {
      render(<Skeleton data-testid="avatar" className="h-12 w-12 rounded-full" />);
      const skeleton = screen.getByTestId('avatar');
      expect(skeleton.className).toContain('h-12');
      expect(skeleton.className).toContain('w-12');
      expect(skeleton.className).toContain('rounded-full');
    });

    it('can be used as card placeholder', () => {
      render(
        <div className="flex flex-col space-y-3">
          <Skeleton data-testid="card-image" className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton data-testid="card-title" className="h-4 w-[250px]" />
            <Skeleton data-testid="card-description" className="h-4 w-[200px]" />
          </div>
        </div>
      );
      expect(screen.getByTestId('card-image')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByTestId('card-description')).toBeInTheDocument();
    });

    it('can be used for table rows', () => {
      render(
        <table>
          <tbody>
            <tr>
              <td>
                <Skeleton data-testid="cell-1" className="h-6 w-20" />
              </td>
              <td>
                <Skeleton data-testid="cell-2" className="h-6 w-32" />
              </td>
              <td>
                <Skeleton data-testid="cell-3" className="h-6 w-24" />
              </td>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByTestId('cell-1')).toBeInTheDocument();
      expect(screen.getByTestId('cell-2')).toBeInTheDocument();
      expect(screen.getByTestId('cell-3')).toBeInTheDocument();
    });
  });

  describe('Composition', () => {
    it('can be composed with other components', () => {
      render(
        <div className="flex items-center space-x-4">
          <Skeleton data-testid="avatar" className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton data-testid="name" className="h-4 w-[100px]" />
            <Skeleton data-testid="email" className="h-4 w-[150px]" />
          </div>
        </div>
      );
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('name')).toBeInTheDocument();
      expect(screen.getByTestId('email')).toBeInTheDocument();
    });
  });
});
