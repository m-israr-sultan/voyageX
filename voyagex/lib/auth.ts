import { User } from './types';

export const AUTH_TOKEN_KEY = 'voyagex_token';
export const AUTH_REFRESH_KEY = 'voyagex_refresh';
export const AUTH_USER_KEY = 'voyagex_user';

export const saveAuth = (accessToken: string, refreshToken: string, user: User) => {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_REFRESH_KEY);
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(AUTH_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'GUIDE':
      return '/guide-panel/dashboard';
    case 'AGENCY':
      return '/agency-panel/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/traveler-panel/dashboard';
  }
};