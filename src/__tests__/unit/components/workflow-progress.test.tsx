/**
 * WorkflowProgress Component Tests
 *
 * Tests for the workflow progress bar component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowProgress } from '@/shared/ui/revisions/workflow-progress';
import type { RevisionWorkflowStatus } from '@/shared/ui/revisions/types';

describe('WorkflowProgress', () => {
  it('should render all workflow step labels', () => {
    render(<WorkflowProgress status="draft" />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approval')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should highlight completed steps for draft status', () => {
    const { container } = render(<WorkflowProgress status="draft" />);

    // First step should be highlighted
    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBe(5);

    // At draft status (index 0), first circle should have ring
    expect(circles[0].className).toContain('ring-2');
  });

  it('should highlight more steps for pending_approval status', () => {
    const { container } = render(<WorkflowProgress status="pending_approval" />);

    const circles = container.querySelectorAll('.rounded-full');

    // First circle should be completed (bg-primary, no ring)
    expect(circles[0].className).toContain('bg-primary');
    // Second circle should be current (with ring)
    expect(circles[1].className).toContain('ring-2');
  });

  it('should highlight all steps for active status', () => {
    const { container } = render(<WorkflowProgress status="active" />);

    const circles = container.querySelectorAll('.rounded-full');

    // All circles should be primary colored
    circles.forEach(circle => {
      expect(circle.className).toContain('bg-primary');
    });
  });

  it('should show muted color for incomplete steps', () => {
    const { container } = render(<WorkflowProgress status="draft" />);

    const circles = container.querySelectorAll('.rounded-full');

    // Steps after current should be muted
    expect(circles[2].className).toContain('bg-muted');
    expect(circles[3].className).toContain('bg-muted');
    expect(circles[4].className).toContain('bg-muted');
  });
});
