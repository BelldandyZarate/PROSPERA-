import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'user_session_data';

// Encriptación básica (mejorable con crypto-js)
const encryptData = (data) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decryptData = (data) => JSON.parse(decodeURIComponent(escape(atob(data))));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // =========================
  // SAVE SESSION
  // =========================
  const saveSession = useCallback((user, accessToken, refreshToken, permisos = []) => {
    const session = {
      user,
      permissions: permisos,
      accessToken,
      refreshToken,
      timestamp: Date.now()
    };

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    localStorage.setItem(STORAGE_KEY, encryptData(session));
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('permissions', JSON.stringify(permisos));

    setUser(user);
    setPermissions(permisos);
  }, []);

  // =========================
  // LOAD SESSION
  // =========================
  const loadSession = useCallback(() => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return null;

      const session = decryptData(encrypted);
      if (!session?.user) return null;

      setUser(session.user);
      setPermissions(session.permissions || []);

      return session;
    } catch {
      return null;
    }
  }, []);

  // =========================
  // CLEAR SESSION
  // =========================
  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    setUser(null);
    setPermissions([]);
  }, []);

  // =========================
  // REFRESH TOKEN
  // =========================
  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) return null;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    setIsRefreshing(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await res.json();

      if (!res.ok) {
        clearSession();
        return null;
      }

      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);

      return data.accessToken;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, clearSession]);

  // =========================
  // VERIFY SESSION
  // =========================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const session = loadSession();

      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
          })
        });

        const data = await res.json();

        if (!data.valid) {
          await refreshAccessToken();
        }
      } catch {
        clearSession();
      }

      setLoading(false);
    };

    init();
  }, [loadSession, refreshAccessToken, clearSession]);

  // =========================
  // LOGIN
  // =========================
  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) return { success: false, error: data.error };

      saveSession(data.user, data.accessToken, data.refreshToken, data.permisos || []);
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // =========================
  // REGISTER
  // =========================
  const register = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      return res.ok ? { success: true, data } : { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Error conexión' };
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ refreshToken })
        });
      }
    } finally {
      clearSession();
    }
  };

  // =========================
  // HELPERS
  // =========================
  const hasPermission = (perm) => permissions.includes(perm);
  const hasRole = (role) => user?.rol === role;
  const getAccessToken = () => localStorage.getItem('access_token');

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      loading,
      login,
      register,
      logout,
      hasPermission,
      hasRole,
      getAccessToken,
      refreshAccessToken,
      isRefreshing
    }}>
      {children}
    </AuthContext.Provider>
  );
};
