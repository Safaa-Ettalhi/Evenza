import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '@/components/EventForm';

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const dateStr = futureDate.toISOString().slice(0, 16);

describe('EventForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
  });

  it('affiche tous les champs du formulaire', () => {
    render(
      <EventForm onSubmit={mockOnSubmit} submitLabel="Créer l'événement" />
    );
    expect(screen.getByLabelText(/Titre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date et heure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Capacité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lieu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Créer l'événement/i })).toBeInTheDocument();
  });

  it('affiche une erreur si le titre est trop court', async () => {
    const user = userEvent.setup();
    render(
      <EventForm onSubmit={mockOnSubmit} submitLabel="Créer" />
    );
    await user.type(screen.getByLabelText(/Titre/i), 'ab');
    await user.type(screen.getByLabelText(/Description/i), 'Description longue de plus de dix caractères');
    await user.type(screen.getByLabelText(/Date et heure/i), dateStr);
    await user.type(screen.getByLabelText(/Capacité/i), '10');
    await user.type(screen.getByLabelText(/Lieu/i), 'Paris');
    await user.click(screen.getByRole('button', { name: /Créer/i }));
    await waitFor(() => {
      expect(screen.getByText(/Le titre doit contenir au moins 3 caractères/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('appelle onSubmit avec les données valides', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    render(
      <EventForm onSubmit={mockOnSubmit} submitLabel="Créer" />
    );
    await user.type(screen.getByLabelText(/Titre/i), 'Formation NestJS');
    await user.type(screen.getByLabelText(/Description/i), 'Description longue de plus de dix caractères pour valider');
    await user.type(screen.getByLabelText(/Date et heure/i), dateStr);
    await user.type(screen.getByLabelText(/Capacité/i), '50');
    await user.type(screen.getByLabelText(/Lieu/i), 'Paris, France');
    await user.click(screen.getByRole('button', { name: /Créer/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Formation NestJS',
          description: 'Description longue de plus de dix caractères pour valider',
          location: 'Paris, France',
          capacity: 50,
        })
      );
    });
  });

  it('affiche le lien Annuler vers /admin/events', () => {
    render(
      <EventForm onSubmit={mockOnSubmit} submitLabel="Créer" />
    );
    const cancelLink = screen.getByRole('link', { name: /Annuler/i });
    expect(cancelLink).toHaveAttribute('href', '/admin/events');
  });
});
