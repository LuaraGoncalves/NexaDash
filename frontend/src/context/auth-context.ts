import { createContext } from 'react';
import type { AuthUser } from '../services/authApi';

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

export type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
