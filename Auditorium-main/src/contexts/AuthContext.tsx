import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@mahendra.info');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!validateEmail(email)) {
      throw new Error('Unauthorized access - Only authorized personnel allowed');
    }

    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      const userData = { id: user.id, email: user.email, name: user.name };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    }
    
    throw new Error('Invalid credentials');
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!validateEmail(email)) {
      throw new Error('Unauthorized access - Only authorized personnel allowed');
    }

    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name
    };

    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};