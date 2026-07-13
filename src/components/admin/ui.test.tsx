import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard, Badge, EmptyState, PageHeader } from './ui';

describe('admin ui primitives', () => {
  it('renders a StatCard with label and value', () => {
    render(<StatCard label="Active galleries" value={7} />);
    expect(screen.getByText('Active galleries')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders a Badge', () => {
    render(<Badge tone="success">Live</Badge>);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('renders an EmptyState', () => {
    render(<EmptyState title="Nothing here" body="Come back later." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Come back later.')).toBeInTheDocument();
  });

  it('renders a PageHeader with an action', () => {
    render(<PageHeader title="Portfolios" action={<button type="button">New</button>} />);
    expect(screen.getByRole('heading', { name: 'Portfolios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });
});
