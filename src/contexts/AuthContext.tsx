import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  appName: string;
  refreshAppName: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appName, setAppName] = useState('SiaSiek Budget');

  const refreshAppName = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setAppName(settings.app_name || 'SiaSiek Budget');
    } catch (error) {
      console.error('Error refreshing app name:', error);
    }
  };

  useEffect(() => {
    // Check if user should be remembered
    const checkRememberedUser = async () => {
      try {
        const settings = await window.electronAPI.getSettings();
        console.log('Checking remembered user. Settings:', settings);
        
        // Load app name
        setAppName(settings.app_name || 'SiaSiek Budget');
        
        if (settings.remember_user && settings.last_user_id) {
          const users = await window.electronAPI.getUsers();
          const rememberedUser = users.find(u => u.id === settings.last_user_id);
          
          if (rememberedUser) {
            console.log('Found remembered user:', rememberedUser.username);
            
            // If password is disabled, auto-login without password
            if (!settings.password_enabled) {
              console.log('Password disabled, auto-login');
              setUser(rememberedUser);
              setIsAuthenticated(true);
            } else {
              console.log('Password enabled, user must login');
              // Password is enabled, user needs to provide password
              // We don't auto-login, but we can pre-fill username
            }
          }
        }
      } catch (error) {
        console.error('Error checking remembered user:', error);
      }
    };

    checkRememberedUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await window.electronAPI.login(username, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        setIsAuthenticated(true);

        // Always update last_user_id when user logs in
        const settings = await window.electronAPI.getSettings();
        await window.electronAPI.updateSettings({
          ...settings,
          last_user_id: loggedInUser.id
        });
        console.log('User logged in, last_user_id updated:', loggedInUser.id);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Update settings: disable remember_user and enable password_enabled
      await window.electronAPI.updateSettings({
        remember_user: 0,
        password_enabled: 1
      });
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Reload the application to force login screen
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if settings update fails, still logout
      setUser(null);
      setIsAuthenticated(false);
      window.location.reload();
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, appName, refreshAppName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
