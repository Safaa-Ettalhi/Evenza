import { render, screen } from '@testing-library/react';
import { EventCard } from '@/components/EventCard';
import { Event } from '@/lib/api';

const mockEvent: Event = {
  _id: 'evt-1',
  title: 'Formation NestJS',
  description: 'Une formation complète sur NestJS et TypeScript.',
  date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  location: 'Paris, France',
  capacity: 50,
  status: 'PUBLISHED',
  availableSpots: 30,
};

describe('EventCard', () => {
  it('affiche le titre de l\'événement', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Formation NestJS')).toBeInTheDocument();
  });

  it('affiche la description', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Une formation complète sur NestJS/)).toBeInTheDocument();
  });

  it('affiche le nombre de places disponibles', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('30 places')).toBeInTheDocument();
  });

  it('affiche le bouton "Voir les détails" quand des places sont disponibles', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByRole('link', { name: /Voir les détails/i })).toBeInTheDocument();
  });

  it('affiche "Complet" et désactive le bouton quand plus de places', () => {
    const fullEvent: Event = { ...mockEvent, availableSpots: 0 };
    render(<EventCard event={fullEvent} />);
    expect(screen.getAllByText('Complet').length).toBeGreaterThan(0);
    const link = screen.getByRole('link');
    const button = link.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('affiche le lieu', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
  });

  it('contient un lien vers la page de détails', () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByRole('link', { name: /Voir les détails/i });
    expect(link).toHaveAttribute('href', '/events/evt-1');
  });
});
