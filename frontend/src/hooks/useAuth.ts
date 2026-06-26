import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, isAuthenticated, removeUser, setUser as setUserStorage, User } from '../lib/auth';
import { removeToken, setToken } from '../lib/api';
import { api } from '../lib/api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const navigate = useNavigate();

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    const { token, user } = response.data;
    setToken(token);
    setUserStorage(user);
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback((): void => {
    removeToken();
    removeUser();
    navigate('/login');
  }, [navigate]);

  return {
    user: getUser(),
    isAuthenticated: isAuthenticated(),
    login,
    logout,
  };
};