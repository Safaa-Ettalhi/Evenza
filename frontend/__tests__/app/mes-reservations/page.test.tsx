import { render, screen, waitFor } from '@testing-library/react';
import MesReservationsPage from '@/app/mes-reservations/page';
import { apiService } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/mes-reservations',
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    token: 'fake-token',
    user: { userId: '1', email: 'test@test.com', role: 'PARTICIPANT' },
  }),
}));

jest.mock('@/lib/api', () => ({
  apiService: {
    getMyReservations: jest.fn(),
    cancelReservation: jest.fn(),
    downloadTicket: jest.fn(),
  },
}));

const mockApi = apiService as jest.Mocked<typeof apiService>;

const mockReservation = {
  _id: 'res-1',
  eventId: {
    _id: 'evt-1',
    title: 'Formation NestJS',
    description: 'Une formation',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paris',
    capacity: 50,
    status: 'PUBLISHED',
    availableSpots: 45,
  },
  userId: 'user-1',
  status: 'CONFIRMED',
  createdAt: new Date().toISOString(),
};

describe('MesReservationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getMyReservations.mockResolvedValue([mockReservation]);
  });

  it('affiche le titre Mes réservations', async () => {
    render(<MesReservationsPage />);
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Mes réservations' })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('appelle getMyReservations au chargement', async () => {
    render(<MesReservationsPage />);
    await waitFor(
      () => {
        expect(mockApi.getMyReservations).toHaveBeenCalledWith('fake-token');
      },
      { timeout: 3000 }
    );
  });
});
