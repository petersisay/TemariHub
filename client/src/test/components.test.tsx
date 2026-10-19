import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { TrackerColumn } from '../components/tracker/TrackerColumn';
import { I18nProvider } from '../context/I18nContext';
import { INITIAL_FIXTURE_OPPORTUNITIES, INITIAL_FIXTURE_TRACKER } from '../services/fixtures';

describe('Common UI Components', () => {
  it('renders Badge with correct label and variants', () => {
    render(<Badge variant="teal">Verified</Badge>);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders Button and responds to click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Application</Button>);

    const btn = screen.getByRole('button', { name: /Submit Application/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables Button and renders spinner when isLoading is true', () => {
    render(<Button isLoading={true}>Saving...</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});

describe('OpportunityCard Component', () => {
  it('renders opportunity title, organization name, and skills', () => {
    const opp = INITIAL_FIXTURE_OPPORTUNITIES[0];
    render(
      <I18nProvider>
        <BrowserRouter>
          <OpportunityCard opportunity={opp} />
        </BrowserRouter>
      </I18nProvider>
    );

    expect(screen.getByText(opp.title)).toBeInTheDocument();
    expect(screen.getByText(opp.organization.name)).toBeInTheDocument();
    expect(screen.getByText(opp.requiredSkills[0])).toBeInTheDocument();
  });
});

describe('TrackerColumn Component', () => {
  it('renders 7-stage status column with item counts', () => {
    const items = INITIAL_FIXTURE_TRACKER.filter((i) => i.status === 'Preparing');
    render(
      <I18nProvider>
        <BrowserRouter>
          <TrackerColumn
            status="Preparing"
            items={items}
            onEditNotes={vi.fn()}
            onStatusChange={vi.fn()}
            onRemove={vi.fn()}
          />
        </BrowserRouter>
      </I18nProvider>
    );

    expect(screen.getAllByText('Preparing')[0]).toBeInTheDocument();
    expect(screen.getByText(items.length.toString())).toBeInTheDocument();
  });
});
