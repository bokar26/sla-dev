import React from 'react';
import { render, screen } from '@testing-library/react';
import CompactProgressBar from '../CompactProgressBar';

describe('CompactProgressBar', () => {
  it('should render with correct accessibility attributes', () => {
    render(
      <CompactProgressBar
        label="TIME SAVED WITH SLA DATA DRIVEN OPTIMIZATIONS"
        saved={120}
        baseline={300}
        format={(val) => `${val}m`}
        totalLabel="Total time spent"
        ariaLabel="Time saved with SLA (search)"
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '40');
    expect(progressBar).toHaveAttribute('aria-label', 'Time saved with SLA (search)');
  });

  it('should show saved and without SLA beneath progress bar, total above bar', () => {
    render(
      <CompactProgressBar
        label="COST SAVINGS WITH SLA DATA DRIVEN INSIGHTS"
        saved={5000}
        baseline={20000}
        format={(val) => `$${val}`}
        totalLabel="Total spend"
      />
    );

    // Check that "Total spend" appears above the progress bar
    const totalSpend = screen.getByText(/Total spend: \$15000/);
    expect(totalSpend).toBeInTheDocument();
    
    // Check that "Saved" appears beneath the progress bar (left)
    const saved = screen.getByText(/Saved: \$5000/);
    expect(saved).toBeInTheDocument();
    
    // Check that "Without SLA" appears beneath the progress bar (right)
    const withoutSLA = screen.getByText(/Without SLA: \$20000/);
    expect(withoutSLA).toBeInTheDocument();
  });

  it('should display correct percentage calculation', () => {
    render(
      <CompactProgressBar
        label="COST SAVINGS WITH SLA DATA DRIVEN INSIGHTS"
        saved={5000}
        baseline={20000}
        format={(val) => `$${val}`}
        totalLabel="Total spend"
      />
    );

    // 5000/20000 = 25%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
  });

  it('should handle zero baseline gracefully', () => {
    render(
      <CompactProgressBar
        label="TEST LABEL"
        saved={100}
        baseline={0}
        format={(val) => `${val}`}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should clamp saved value to not exceed baseline', () => {
    render(
      <CompactProgressBar
        label="TEST LABEL"
        saved={500}
        baseline={300}
        format={(val) => `${val}`}
      />
    );

    // Should be clamped to 100% (300/300)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
