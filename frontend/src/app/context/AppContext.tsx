import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccountType, User } from '../data/mockData';
import { getCurrentUser, logoutRequest } from '../api/auth';
import { getAccessToken } from '../api/client';

interface AppContextValue {
  user: User | null;
  accountType: AccountType | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  selectedGarage: string | null;
  setSelectedGarage: (g: string | null) => void;
  login: (type: AccountType) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedGarage, setSelectedGarage] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      setIsAuthLoading(false);
      return;
    }

    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsLoggedIn(true);
      } catch {
        logoutRequest();
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  const login = (_type: AccountType) => {
    setIsAuthLoading(true);
    setIsLoggedIn(true);
    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsLoggedIn(true);
      } catch {
        logoutRequest();
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false);
      }
    })();
  };

  const logout = () => {
    logoutRequest();
    setUser(null);
    setIsLoggedIn(false);
    setIsAuthLoading(false);
  };

  return (
    <AppContext.Provider value={{
      user,
      accountType: user?.accountType ?? null,
      isLoggedIn,
      isAuthLoading,
      selectedGarage,
      setSelectedGarage,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
