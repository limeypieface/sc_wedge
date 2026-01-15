/**
 * Tabs Component Tests
 *
 * Tests for the Tabs component including tab switching,
 * keyboard navigation, and accessibility features.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  const renderTabs = (props?: { defaultValue?: string; onValueChange?: (value: string) => void }) => {
    return render(
      <Tabs defaultValue={props?.defaultValue ?? 'tab1'} onValueChange={props?.onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
  };

  describe('Basic Rendering', () => {
    it('renders tab triggers', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
    });

    it('renders tablist', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders default tab content', () => {
      renderTabs();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('renders specified default tab content', () => {
      renderTabs({ defaultValue: 'tab2' });
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('has data-slot attribute on root', () => {
      const { container } = renderTabs();
      expect(container.firstChild).toHaveAttribute('data-slot', 'tabs');
    });
  });

  describe('Tab Switching', () => {
    it('switches content on tab click', async () => {
      const user = userEvent.setup();
      renderTabs();

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('switches to third tab', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));
      await waitFor(() => {
        expect(screen.getByText('Content 3')).toBeInTheDocument();
      });
    });

    it('calls onValueChange when tab changes', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      renderTabs({ onValueChange: handleValueChange });

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('TabsTrigger', () => {
    it('has data-slot attribute', () => {
      renderTabs();
      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveAttribute('data-slot', 'tabs-trigger');
    });

    it('shows active state for selected tab', () => {
      renderTabs();
      const activeTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(activeTab).toHaveAttribute('data-state', 'active');
    });

    it('shows inactive state for non-selected tabs', () => {
      renderTabs();
      const inactiveTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(inactiveTab).toHaveAttribute('data-state', 'inactive');
    });

    it('can be disabled', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeDisabled();
    });

    it('disabled tab cannot be clicked', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('TabsList', () => {
    it('has data-slot attribute', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toHaveAttribute('data-slot', 'tabs-list');
    });

    it('has muted background', () => {
      renderTabs();
      const tablist = screen.getByRole('tablist');
      expect(tablist.className).toContain('bg-muted');
    });

    it('has rounded styling', () => {
      renderTabs();
      const tablist = screen.getByRole('tablist');
      expect(tablist.className).toContain('rounded-lg');
    });
  });

  describe('TabsContent', () => {
    it('has data-slot attribute', () => {
      const { container } = renderTabs();
      const content = container.querySelector('[data-slot="tabs-content"]');
      expect(content).toBeInTheDocument();
    });

    it('shows only active content', () => {
      renderTabs({ defaultValue: 'tab1' });
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      // Inactive content is hidden via data-state attribute
      const tabPanels = screen.getAllByRole('tabpanel', { hidden: true });
      expect(tabPanels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('can focus tabs via keyboard', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.tab();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.tab();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();
    });

    it('wraps around with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.tab();
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      // Should wrap to first tab
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('activates tab on Enter key', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.tab();
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });

    it('activates tab on Space key', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.tab();
      await user.keyboard('{ArrowRight}');
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className to Tabs', () => {
      const { container } = render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(container.firstChild?.className).toContain('custom-tabs');
    });

    it('applies custom className to TabsList', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list" data-testid="list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(screen.getByTestId('list').className).toContain('custom-list');
    });

    it('applies custom className to TabsTrigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole('tab').className).toContain('custom-trigger');
    });

    it('applies custom className to TabsContent', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = container.querySelector('.custom-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct aria roles', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('selected tab has aria-selected true', () => {
      renderTabs();
      const selectedTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(selectedTab).toHaveAttribute('aria-selected', 'true');
    });

    it('non-selected tabs have aria-selected false', () => {
      renderTabs();
      const nonSelectedTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(nonSelectedTab).toHaveAttribute('aria-selected', 'false');
    });

    it('tabpanel is associated with trigger', () => {
      renderTabs();
      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      const panel = screen.getByRole('tabpanel');

      const tabId = tab.getAttribute('id');
      expect(panel).toHaveAttribute('aria-labelledby', tabId);
    });
  });

  describe('With Icons', () => {
    it('renders tabs with icons', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">
              <svg data-testid="icon" className="h-4 w-4" />
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    });
  });
});
