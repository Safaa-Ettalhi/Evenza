import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockApi = apiService as jest.Mocked<typeof apiService>;

function TestConsumer() {
  const { user, isAuthenticated, login, register, logout, isLoading } = useAuth();
  if (isLoading) return <div>Chargement...</div>;
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-email">{user?.email ?? 'null'}</span>
      <button onClick={() => login('test@test.com', 'password123')}>Login</button>
      <button onClick={() => register('new@test.com', 'password123')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('fournit un contexte non authentifié par défaut', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('null');
    });
  });

  it('login met à jour l\'état après succès', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiUEFSVElDSVBBTlQiLCJpYXQiOjE2MDAwMDAwMDB9.xxx';
    mockApi.login.mockResolvedValue({ access_token: token });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => {
      expect(mockApi.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    });
  });

  it('logout réinitialise l\'état', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiUEFSVElDSVBBTlQiLCJpYXQiOjE2MDAwMDAwMDB9.xxx';
    mockApi.login.mockResolvedValue({ access_token: token });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('null');
    });
  });

  it('register appelle login après inscription', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6Im5ld0B0ZXN0LmNvbSIsInJvbGUiOiJQQVJUSUNJUEFOVCIsImlhdCI6MTYwMDAwMDAwMH0.xxx';
    mockApi.register.mockResolvedValue({ message: 'OK', userId: '123' });
    mockApi.login.mockResolvedValue({ access_token: token });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText('Register')).toBeInTheDocument());
    await act(async () => {
      await userEvent.click(screen.getByText('Register'));
    });
    await waitFor(() => {
      expect(mockApi.register).toHaveBeenCalledWith({ email: 'new@test.com', password: 'password123' });
      expect(mockApi.login).toHaveBeenCalledWith({ email: 'new@test.com', password: 'password123' });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
  });
});
