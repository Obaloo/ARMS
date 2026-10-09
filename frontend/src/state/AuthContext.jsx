import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const value = localStorage.getItem('arms_user');
    return value ? JSON.parse(value) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data;
      localStorage.setItem('arms_access_token', payload.accessToken);
      localStorage.setItem('arms_refresh_token', payload.refreshToken);
      localStorage.setItem('arms_user', JSON.stringify(payload.user));
      setUser(payload.user);
      return payload.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('arms_access_token');
    localStorage.removeItem('arms_refresh_token');
    localStorage.removeItem('arms_user');
    setUser(null);
    // Let the Login page show a visible "signed out" confirmation.
    sessionStorage.setItem('arms_logout_feedback', 'You have been signed out.');
  };

  const refreshMe = useCallback(async () => {
    if (!localStorage.getItem('arms_access_token')) {
      return;
    }
    try {
      const response = await api.get('/auth/me');
      localStorage.setItem('arms_user', JSON.stringify(response.data));
      setUser(response.data);
    } catch {
      logout();
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshMe,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
