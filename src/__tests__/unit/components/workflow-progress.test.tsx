/**
 * WorkflowProgress Component Tests
 *
 * Tests for the workflow progress bar component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowProgress } from '../../../app/supply/purchase-orders/_components/revision-status-panel/workflow-progress';
import { RevisionStatus } from '../../../types/enums';

describe('WorkflowProgress', () => {
  it('should render workflow progress title', () => {
    render(<WorkflowProgress status={RevisionStatus.Draft} />);

    expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
  });

  it('should render all workflow step labels', () => {
    render(<WorkflowProgress status={RevisionStatus.Draft} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approval')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should highlight completed steps for Draft status', () => {
    const { container } = render(<WorkflowProgress status={RevisionStatus.Draft} />);

    // First step should be highlighted (bg-primary)
    const progressBars = container.querySelectorAll('.rounded-full');
    expect(progressBars.length).toBe(5);

    // At Draft status (index 0), only first bar should be primary
    expect(progressBars[0].className).toContain('bg-primary');
  });

  it('should highlight more steps for PendingApproval status', () => {
    const { container } = render(<WorkflowProgress status={RevisionStatus.PendingApproval} />);

    const progressBars = container.querySelectorAll('.rounded-full');

    // First two steps should be highlighted
    expect(progressBars[0].className).toContain('bg-primary');
    expect(progressBars[1].className).toContain('bg-primary');
  });

  it('should highlight all steps for Acknowledged status', () => {
    const { container } = render(<WorkflowProgress status={RevisionStatus.Acknowledged} />);

    const progressBars = container.querySelectorAll('.rounded-full');

    // All steps should be highlighted
    progressBars.forEach(bar => {
      expect(bar.className).toContain('bg-primary');
    });
  });

  it('should show muted color for incomplete steps', () => {
    const { container } = render(<WorkflowProgress status={RevisionStatus.Draft} />);

    const progressBars = container.querySelectorAll('.rounded-full');

    // Steps after current should be muted
    expect(progressBars[2].className).toContain('bg-muted');
    expect(progressBars[3].className).toContain('bg-muted');
    expect(progressBars[4].className).toContain('bg-muted');
  });
});
