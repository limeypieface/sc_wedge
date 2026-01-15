import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SQLDropdown } from '../sql-dropdown';

describe('SQLDropdown', () => {
  const sampleSQL = `SELECT id, name, email, created_at
    FROM users
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 10`;

  it('should render the View Data Query button', () => {
    render(<SQLDropdown sql={sampleSQL} />);

    const button = screen.getByRole('button', { name: /view data query/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cursor-pointer');
  });

  it('should display the Code icon in the button', () => {
    render(<SQLDropdown sql={sampleSQL} />);

    const button = screen.getByRole('button', { name: /view data query/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });



  it('should handle empty SQL gracefully', () => {
    render(<SQLDropdown sql="" />);

    const button = screen.getByRole('button', { name: /view data query/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle very long SQL queries', () => {
    const longSQL = Array(50).fill('SELECT * FROM table').join(' UNION ');
    render(<SQLDropdown sql={longSQL} />);

    const button = screen.getByRole('button', { name: /view data query/i });
    expect(button).toBeInTheDocument();
  });
});