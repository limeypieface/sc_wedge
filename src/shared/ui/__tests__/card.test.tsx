/**
 * Card Component Tests
 *
 * Tests for the Card component and its subcomponents including
 * composition, styling, and accessibility features.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '../card';

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(<Card data-testid="card">Test</Card>);
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    });

    it('renders as div element', () => {
      render(<Card data-testid="card">Test</Card>);
      expect(screen.getByTestId('card').tagName).toBe('DIV');
    });
  });

  describe('Styling', () => {
    it('has background styling', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-background');
    });

    it('has border styling', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border');
    });

    it('has rounded corners', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-xl');
    });

    it('has shadow', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('shadow-sm');
    });

    it('applies custom className', () => {
      render(
        <Card data-testid="card" className="custom-class">
          Test
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-class');
    });
  });
});

describe('CardHeader', () => {
  it('renders with children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardHeader data-testid="header">Test</CardHeader>);
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header');
  });

  it('has grid layout', () => {
    render(<CardHeader data-testid="header">Test</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header.className).toContain('grid');
  });

  it('applies custom className', () => {
    render(
      <CardHeader data-testid="header" className="extra-padding">
        Test
      </CardHeader>
    );
    const header = screen.getByTestId('header');
    expect(header.className).toContain('extra-padding');
  });
});

describe('CardTitle', () => {
  it('renders with children', () => {
    render(<CardTitle>My Card Title</CardTitle>);
    expect(screen.getByText('My Card Title')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardTitle data-testid="title">Test</CardTitle>);
    expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title');
  });

  it('has font styling', () => {
    render(<CardTitle data-testid="title">Test</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title.className).toContain('font-semibold');
  });

  it('applies custom className', () => {
    render(
      <CardTitle data-testid="title" className="text-lg">
        Large Title
      </CardTitle>
    );
    const title = screen.getByTestId('title');
    expect(title.className).toContain('text-lg');
  });
});

describe('CardDescription', () => {
  it('renders with children', () => {
    render(<CardDescription>This is a description</CardDescription>);
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardDescription data-testid="desc">Test</CardDescription>);
    expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description');
  });

  it('has muted text styling', () => {
    render(<CardDescription data-testid="desc">Test</CardDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc.className).toContain('text-muted-foreground');
  });

  it('has small text size', () => {
    render(<CardDescription data-testid="desc">Test</CardDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc.className).toContain('text-sm');
  });
});

describe('CardContent', () => {
  it('renders with children', () => {
    render(<CardContent>Main content here</CardContent>);
    expect(screen.getByText('Main content here')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardContent data-testid="content">Test</CardContent>);
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content');
  });

  it('has horizontal padding', () => {
    render(<CardContent data-testid="content">Test</CardContent>);
    const content = screen.getByTestId('content');
    expect(content.className).toContain('px-6');
  });
});

describe('CardFooter', () => {
  it('renders with children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
  });

  it('has flex layout', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('flex');
  });

  it('has items centered', () => {
    render(<CardFooter data-testid="footer">Test</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('items-center');
  });
});

describe('CardAction', () => {
  it('renders with children', () => {
    render(<CardAction>Action button</CardAction>);
    expect(screen.getByText('Action button')).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<CardAction data-testid="action">Test</CardAction>);
    expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action');
  });

  it('has proper grid positioning', () => {
    render(<CardAction data-testid="action">Test</CardAction>);
    const action = screen.getByTestId('action');
    expect(action.className).toContain('col-start-2');
    expect(action.className).toContain('row-span-2');
  });
});

describe('Card Composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>Footer area</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main content area')).toBeInTheDocument();
    expect(screen.getByText('Footer area')).toBeInTheDocument();
  });

  it('renders card with action button', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardAction>
            <button type="button">Edit</button>
          </CardAction>
        </CardHeader>
      </Card>
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders card with multiple content sections', () => {
    render(
      <Card>
        <CardContent>Section 1</CardContent>
        <CardContent>Section 2</CardContent>
      </Card>
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('supports role attribute', () => {
    render(
      <Card role="article" data-testid="card">
        Article content
      </Card>
    );
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('supports aria-labelledby', () => {
    render(
      <Card aria-labelledby="card-title" data-testid="card">
        <CardHeader>
          <CardTitle id="card-title">My Card</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveAttribute(
      'aria-labelledby',
      'card-title'
    );
  });

  it('supports aria-describedby', () => {
    render(
      <Card aria-describedby="card-desc" data-testid="card">
        <CardHeader>
          <CardDescription id="card-desc">Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveAttribute(
      'aria-describedby',
      'card-desc'
    );
  });

  it('can contain interactive elements', () => {
    render(
      <Card>
        <CardContent>
          <button type="button">Action 1</button>
          <button type="button">Action 2</button>
        </CardContent>
      </Card>
    );

    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
  });
});
