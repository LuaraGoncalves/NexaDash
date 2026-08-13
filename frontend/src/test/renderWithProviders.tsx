import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../context/auth-context';
import type { AuthUser } from '../services/authApi';

type RenderOptions = {
  route?: string;
  auth?: Partial<AuthContextValue>;
};

function createAuthValue(overrides?: Partial<AuthContextValue>): AuthContextValue {
  const defaultUser: AuthUser | null = null;

  return {
    user: defaultUser,
    token: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const authValue = createAuthValue(options?.auth);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[options?.route ?? '/']}>{children}</MemoryRouter>
      </AuthContext.Provider>
    );
  }

  return {
    authValue,
    ...render(ui, { wrapper: Wrapper }),
  };
}
