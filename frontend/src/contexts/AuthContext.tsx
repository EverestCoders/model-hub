import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  walletAddress: string;
  username: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  connectWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in from local storage
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const connectWallet = async () => {
    if (user) {
      logout();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if ethereum/web3 provider exists
      if (!(window as any).ethereum) {
        throw new Error('No wallet found. Please install MetaMask or another Ethereum wallet.');
      }
      
      // Request account access
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const walletAddress = accounts[0];
      
      // First let's check if we can sign in directly
      try {
        // Get nonce from your backend
        console.log("Getting nonce for login attempt");
        const { nonce } = await authService.getNonce(walletAddress);
        
        // Create the message to sign
        const message = `Sign this message to authenticate with Everest Model Hub: ${nonce}`;
        
        // Request signature from the user
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress],
        });
        
        // Try to connect with existing account
        const response = await authService.connectWallet(walletAddress, signature);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        
      } catch (loginErr) {
        console.log("Login failed:", loginErr);
        
        // If user doesn't exist, we need to register
        if ((loginErr as Error).message.includes('not found')) {
          // Get a fresh nonce for registration
          const { nonce: regNonce } = await authService.getNonce(walletAddress);
          
          // Create the registration message
          const regMessage = `Sign this message to authenticate with Everest Model Hub: ${regNonce}`;
          
          // Get a fresh signature for registration
          const regSignature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [regMessage, walletAddress],
          });
          
          // Generate a username
          const username = `0x${walletAddress.substring(2, 8)}...`;
          // const username = `Hello`;
          
          // Register new user
          // await register(walletAddress, regSignature, username);
          console.log("Registering with signature");
          const registerResponse = await authService.register(
            walletAddress, 
            regSignature, 
            username
          );
          
          localStorage.setItem('auth_token', registerResponse.token);
          localStorage.setItem('user', JSON.stringify(registerResponse.user));
          setUser(registerResponse.user);
        } else {
          throw loginErr;
        }
      }
    } catch (err) {
      console.error('Connection error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        logout,
        connectWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};