import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';
import { setAccessToken, setUnauthorizedHandler, extractError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // On first load, try to silently refresh using the httpOnly cookie so a
  // page reload keeps the user logged in.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await authApi.me();
        setUser(res.data.data.user);
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      const { user: loggedInUser, accessToken } = res.data.data;
      setAccessToken(accessToken);
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: extractError(err) };
    }
  };

  const register = async (payload) => {
    try {
      const res = await authApi.register(payload);
      const { user: newUser, accessToken } = res.data.data;
      setAccessToken(accessToken);
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: extractError(err) };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    clearSession();
  };

  const refreshMe = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        initializing,
        login,
        register,
        logout,
        refreshMe,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
