import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/Header';

const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });
  });

  it('affiche le logo Evenza', () => {
    render(<Header />);
    const logo = screen.getByRole('link', { name: /Evenza/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  it('affiche Connexion et Inscription quand non authentifié', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /Connexion/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Inscription/i })).toBeInTheDocument();
  });

  it('affiche l\'email et les liens Catalogue et Mes réservations quand participant', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { userId: '1', email: 'participant@test.com', role: 'PARTICIPANT' },
      logout: mockLogout,
    });
    render(<Header />);
    expect(screen.getByText('participant@test.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Catalogue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mes réservations/i })).toBeInTheDocument();
  });

  it('appelle logout au clic sur Déconnexion', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { userId: '1', email: 'participant@test.com', role: 'PARTICIPANT' },
      logout: mockLogout,
    });
    const user = userEvent.setup();
    render(<Header />);
    const logoutButton = screen.getByRole('button', { name: /Déconnexion/i });
    await user.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
});
