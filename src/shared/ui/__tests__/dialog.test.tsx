/**
 * Dialog Component Tests
 *
 * Tests for the Dialog component and its subcomponents including
 * open/close behavior, focus management, and accessibility.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog';

describe('Dialog', () => {
  describe('Basic Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Hidden Content</DialogContent>
        </Dialog>
      );
      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });

    it('renders content when open', () => {
      render(
        <Dialog open>
          <DialogContent>Visible Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Visible Content')).toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    it('opens when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Dialog Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('closes when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByText('Content')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Escapable Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByText('Escapable Content')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Escapable Content')).not.toBeInTheDocument();
      });
    });

    it('calls onOpenChange when state changes', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Controlled Mode', () => {
    it('works as controlled component', async () => {
      const user = userEvent.setup();

      const ControlledDialog = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>External Open</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Controlled</DialogTitle>
                Controlled Content
              </DialogContent>
            </Dialog>
          </>
        );
      };

      render(<ControlledDialog />);

      expect(screen.queryByText('Controlled Content')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'External Open' }));
      expect(screen.getByText('Controlled Content')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('shows close button by default', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Title</DialogTitle>
            No Close Button
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });
  });
});

describe('DialogHeader', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>Header Content</DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'dialog-header');
  });

  it('has flex column layout', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    );
    const header = screen.getByTestId('header');
    expect(header.className).toContain('flex');
    expect(header.className).toContain('flex-col');
  });
});

describe('DialogFooter', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter>Footer Content</DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'dialog-footer');
  });

  it('has flex layout with justify-end', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('flex');
    expect(footer.className).toContain('sm:justify-end');
  });
});

describe('DialogTitle', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>My Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle data-testid="title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'dialog-title');
  });

  it('has heading role', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Heading Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole('heading', { name: 'Heading Title' })).toBeInTheDocument();
  });

  it('has proper font styling', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle data-testid="title">Styled</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const title = screen.getByTestId('title');
    expect(title.className).toContain('font-semibold');
    expect(title.className).toContain('text-lg');
  });
});

describe('DialogDescription', () => {
  it('renders with children', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>This is the description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('This is the description')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription data-testid="desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'dialog-description');
  });

  it('has muted text styling', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription data-testid="desc">Muted</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const desc = screen.getByTestId('desc');
    expect(desc.className).toContain('text-muted-foreground');
    expect(desc.className).toContain('text-sm');
  });
});

describe('DialogClose', () => {
  it('closes the dialog when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Custom Close')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Custom Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Custom Close')).not.toBeInTheDocument();
    });
  });
});

describe('Dialog Composition', () => {
  it('renders complete dialog structure', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open Full Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>Are you sure you want to proceed?</DialogDescription>
          </DialogHeader>
          <div>Main content area</div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button type="button">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open Full Dialog' }));

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByText('Main content area')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has dialog role when open', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          Content
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-labelledby linking to title', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Labeled Dialog</DialogTitle>
          Content
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('has aria-describedby linking to description', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('close button has accessible name', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          Content
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
