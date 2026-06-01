/**
 * AuthContext.jsx — Authentication State Management
 *
 * Security rules:
 * - JWT stored in React state (in-memory) ONLY — NOT localStorage/sessionStorage
 * - Logout clears all state and redirects (full page reload clears cache)
 * - No token or user data logged to console
 *
 * TODO(security): For production, migrate to HttpOnly cookie strategy where
 * the backend sets the cookie directly, eliminating any JS-accessible token.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import apiClient, { setAuthToken, clearAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Token in React state — survives re-renders but NOT page refresh (intentional for demo)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  /**
   * Register a new user account.
   * @param {string} email
   * @param {string} password
   */
  const register = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/v1/auth/register', { email, password });
      const { user: userData, token: jwt } = data.data;

      setToken(jwt);
      setUser(userData);
      setAuthToken(jwt); // Inject into axios (memory only)

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message, errors: err.errors };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log in with email and password.
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
      const { user: userData, token: jwt } = data.data;

      setToken(jwt);
      setUser(userData);
      setAuthToken(jwt);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out — clears all in-memory state and redirects.
   * Full page reload ensures any cached React state is wiped.
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore — always clear local state regardless
    } finally {
      clearAuthToken();
      setToken(null);
      setUser(null);
      // Hard redirect to clear all component state
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
