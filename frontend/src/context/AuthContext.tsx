import React, { useEffect, useState, createContext, useContext } from 'react';
interface User {
  id: string;
  name: string;
  email: string;
}
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  useEffect(() => {
    if (token) {
      // For demo purposes, we'll just set a mock user
      // In a real app, you'd validate the token and fetch user data
      setUser({
        id: '1',
        name: 'Demo User',
        email: 'user@example.com'
      });
    }
  }, [token]);
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // This would be an actual API call in production
      // For demo, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock successful login
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser({
        id: '1',
        name: 'Demo User',
        email: email
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // This would be an actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock successful registration
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser({
        id: '1',
        name: name,
        email: email
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};