/**
 * Table Component Tests
 *
 * Tests for the Table component and its subcomponents including
 * structure, styling, and accessibility features.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../table';

describe('Table', () => {
  describe('Basic Rendering', () => {
    it('renders a table element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders with data-slot attribute', () => {
      render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByRole('table')).toHaveAttribute('data-slot', 'table');
    });

    it('is wrapped in a container div', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('data-slot', 'table-container');
    });

    it('container has overflow handling', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('overflow-x-auto');
    });
  });

  describe('Styling', () => {
    it('has full width', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByRole('table');
      expect(table.className).toContain('w-full');
    });

    it('has caption-bottom positioning', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByRole('table');
      expect(table.className).toContain('caption-bottom');
    });

    it('applies custom className', () => {
      render(
        <Table className="custom-table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByRole('table');
      expect(table.className).toContain('custom-table');
    });
  });
});

describe('TableHeader', () => {
  it('renders thead element', () => {
    render(
      <Table>
        <TableHeader data-testid="header">
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('header').tagName).toBe('THEAD');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableHeader data-testid="header">
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'table-header');
  });
});

describe('TableBody', () => {
  it('renders tbody element', () => {
    render(
      <Table>
        <TableBody data-testid="body">
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('body').tagName).toBe('TBODY');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableBody data-testid="body">
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('body')).toHaveAttribute('data-slot', 'table-body');
  });

  it('removes border from last row', () => {
    render(
      <Table>
        <TableBody data-testid="body">
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const body = screen.getByTestId('body');
    expect(body.className).toContain('[&_tr:last-child]:border-0');
  });
});

describe('TableFooter', () => {
  it('renders tfoot element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="footer">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(screen.getByTestId('footer').tagName).toBe('TFOOT');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="footer">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'table-footer');
  });

  it('has muted background', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="footer">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('bg-muted/50');
  });
});

describe('TableRow', () => {
  it('renders tr element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('row').tagName).toBe('TR');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('row')).toHaveAttribute('data-slot', 'table-row');
  });

  it('has selected state styling', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('data-[state=selected]:bg-muted');
  });

  it('has transition styling', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByTestId('row');
    expect(row.className).toContain('transition-colors');
  });
});

describe('TableHead', () => {
  it('renders th element', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="head">Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('head').tagName).toBe('TH');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="head">Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('head')).toHaveAttribute('data-slot', 'table-head');
  });

  it('has columnheader role', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('columnheader')).toBeInTheDocument();
  });

  it('has font-medium styling', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="head">Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const head = screen.getByTestId('head');
    expect(head.className).toContain('font-medium');
  });
});

describe('TableCell', () => {
  it('renders td element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="cell">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('cell').tagName).toBe('TD');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="cell">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('cell')).toHaveAttribute('data-slot', 'table-cell');
  });

  it('has cell role', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('cell')).toBeInTheDocument();
  });

  it('has padding styling', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="cell">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const cell = screen.getByTestId('cell');
    expect(cell.className).toContain('p-2');
  });
});

describe('TableCaption', () => {
  it('renders caption element', () => {
    render(
      <Table>
        <TableCaption data-testid="caption">Table description</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('caption').tagName).toBe('CAPTION');
  });

  it('has data-slot attribute', () => {
    render(
      <Table>
        <TableCaption data-testid="caption">Table description</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('caption')).toHaveAttribute('data-slot', 'table-caption');
  });

  it('has muted text color', () => {
    render(
      <Table>
        <TableCaption data-testid="caption">Description</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const caption = screen.getByTestId('caption');
    expect(caption.className).toContain('text-muted-foreground');
  });
});

describe('Table Composition', () => {
  it('renders complete table structure', () => {
    render(
      <Table>
        <TableCaption>A list of items</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Item 1</TableCell>
            <TableCell>$10</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Item 2</TableCell>
            <TableCell>$20</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>$30</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText('A list of items')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$30')).toBeInTheDocument();
  });

  it('renders multiple rows correctly', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Row 1</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Row 2</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Row 3</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('renders multiple columns correctly', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col 1</TableHead>
            <TableHead>Col 2</TableHead>
            <TableHead>Col 3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>A</TableCell>
            <TableCell>B</TableCell>
            <TableCell>C</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);

    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(3);
  });
});

describe('Accessibility', () => {
  it('has proper table structure for screen readers', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Widget</TableCell>
            <TableCell>$5</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    // thead and tbody both have role="rowgroup"
    expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('supports scope attribute on headers', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Column Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('columnheader')).toHaveAttribute('scope', 'col');
  });

  it('caption provides accessible name', () => {
    render(
      <Table>
        <TableCaption>Product inventory list</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table', { name: 'Product inventory list' })).toBeInTheDocument();
  });
});
