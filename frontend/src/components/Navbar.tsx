import React, { useState, useEffect } from 'react';
import { Package } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import { authService } from '../services/auth.service';

const Navbar: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userInfo, setUserInfo] = useState<{ id: string; username: string | null; } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsConnected(true);
      setUserInfo(JSON.parse(user));
    }
  }, []);

  const connectWallet = async () => {
    if (isConnected) {
      // Logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setIsConnected(false);
      setUserInfo(null);
      return;
    }
    
    setIsConnecting(true);
    
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
        const message = `Sign this message to authenticate with FileCoin Model Hub: ${nonce}`;
        
        // Request signature from the user
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress],
        });
        
        // Try to connect with existing account
        const response = await authService.connectWallet(walletAddress, signature);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setIsConnected(true);
        setUserInfo(response.user);
        
      } catch (loginErr) {
        console.log("Login failed:", loginErr);
        
        // If user doesn't exist, we need to register
        if ((loginErr as Error).message.includes('not found')) {
          // Get a fresh nonce for registration
          console.log("Getting new nonce for registration");
          const { nonce: regNonce } = await authService.getNonce(walletAddress);
          
          // Create the registration message
          const regMessage = `Sign this message to authenticate with FileCoin Model Hub: ${regNonce}`;
          
          // Get a fresh signature for registration
          const regSignature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [regMessage, walletAddress],
          });
          
          // Generate a username
          const username = `0x${walletAddress.substring(2, 8)}...`;
          
          console.log("Registering with signature");
          const registerResponse = await authService.register(
            walletAddress, 
            regSignature, 
            username
          );
          
          localStorage.setItem('auth_token', registerResponse.token);
          localStorage.setItem('user', JSON.stringify(registerResponse.user));
          setIsConnected(true);
          setUserInfo(registerResponse.user);
        } else {
          throw loginErr;
        }
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  console.log(location.pathname);

  return (
    <header className="flex items-center justify-between mb-12">
      <Link to="/" className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        <span className="font-semibold text-lg">EVEREST MODEL HUB</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/" className={`text-sm font-medium ${isActive("/") ? "text-blue-600" : ""}`}>
          Home
        </Link>
        <Link to="/models" className={`text-sm font-medium ${isActive("/models") ? "text-blue-600" : ""}`}>
          Explore
        </Link>
        {isConnected && (
          <Link to="/upload" className={`text-sm font-medium ${isActive("/upload") ? "text-blue-600" : ""}`}>
            Upload
          </Link>
        )}
      </nav>
      <Button 
        variant="default" 
        className="bg-gray-800 text-white w-48"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting 
          ? 'Connecting...' 
          : isConnected 
            ? userInfo?.username || 'Disconnect' 
            : 'Connect Wallet'}
      </Button>
    </header>
  );
};

export default Navbar;