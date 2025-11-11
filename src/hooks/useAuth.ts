import { useEffect, useState, useCallback } from 'react';
import type { User } from '../types';
import { DataService } from '../services/DataService';

interface UseAuthResult {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = DataService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = useCallback((nextUser: User) => {
    DataService.setCurrentUser(nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    DataService.setCurrentUser(null);
    setUser(null);
  }, []);

  return {
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };
};

export default useAuth;

