import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRegister = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le formulaire d\'inscription', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Inscription')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmer le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S'inscrire/i })).toBeInTheDocument();
  });

  it('affiche le lien vers la page de connexion', () => {
    render(<RegisterPage />);
    const link = screen.getByRole('link', { name: /Se connecter/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/Email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/^Mot de passe/i), 'password123');
    await user.type(screen.getByLabelText(/Confirmer le mot de passe/i), 'different');
    await user.click(screen.getByRole('button', { name: /S'inscrire/i }));
    await waitFor(() => {
      expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('appelle register et redirige après succès', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ userId: '1', email: 'new@test.com', role: 'PARTICIPANT' });
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/Email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/^Mot de passe/i), 'password123');
    await user.type(screen.getByLabelText(/Confirmer le mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /S'inscrire/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('new@test.com', 'password123');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 500 });
  });
});
