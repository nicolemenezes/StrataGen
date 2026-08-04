// /frontend/src/hooks/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSession, onAuthStateChange } from '../services/api/authApi';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string | null;
  role?: string;
}

interface AuthSession {
  access_token: string;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

// Define the shape of the context's value
interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for an active session on initial load
    const getInitialSession = async () => {
      const { data: { session } } = await getSession();
      setSession(session);
      setUser(session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email,
          }
        : null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name || session.user.email,
            }
          : null);
        setIsLoading(false);
      }
    );

    // Cleanup the subscription on component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};