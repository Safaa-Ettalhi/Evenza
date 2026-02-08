import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockLogin = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le formulaire de connexion', () => {
    render(<LoginPage />);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('affiche le lien vers la page d\'inscription', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /Créer un compte/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('affiche une erreur de validation pour mot de passe trop court', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), '12345');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/au moins 6 caractères/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('affiche une erreur pour mot de passe trop court', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), '12345');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/au moins 6 caractères/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('appelle login et redirige après succès', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ userId: '1', email: 'test@test.com', role: 'PARTICIPANT' });
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 1000 });
  });

  it('affiche l\'erreur du serveur en cas d\'échec', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Identifiants incorrects'));
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => {
      expect(screen.getByText(/Identifiants incorrects/i)).toBeInTheDocument();
    });
  });
});
