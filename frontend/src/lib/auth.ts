const USER_KEY = 'salary_user';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('salary_token') !== null;
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};