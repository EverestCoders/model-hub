import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { authService } from '../services/auth.service';
import Details from './Details';

// Simple icons for UI
const Briefcase = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const Mail = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const Clock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/models');
    }
  }, [navigate]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
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
        navigate('/models');
        
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
          const username = `0x${walletAddress.substring(2, 8)}`;
          
          
          console.log("Registering with signature");
          const registerResponse = await authService.register(
            walletAddress, 
            regSignature, 
            username
          );
          
          localStorage.setItem('auth_token', registerResponse.token);
          localStorage.setItem('user', JSON.stringify(registerResponse.user));
          navigate('/models');
        } else {
          throw loginErr;
        }
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="h-screen bg-white"> 
      {/* Navigation */}
      <header className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2"><Briefcase /></span>
            <span className="text-lg font-bold">EVEREST MODEL HUB</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium">Home</a>
            <a href="#" className="text-sm font-medium">Models</a>
            <a href="#" className="text-sm font-medium">Upload</a>
            <a href="#" className="text-sm font-medium">Search</a>
          </nav>

          <Button 
            variant="default" 
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 p-4 bg-purple-50 rounded-full opacity-80">
          <span className="text-purple-300"><Briefcase /></span>
        </div>

        <div className="absolute top-20 left-1/2 -translate-x-1/2 p-4 bg-pink-50 rounded-full opacity-80">
          <span className="text-pink-300"><Briefcase /></span>
        </div>

        <div className="absolute top-0 right-1/4 -translate-x-1/2 p-4 bg-cyan-50 rounded-full opacity-80">
          <span className="text-cyan-300"><Mail /></span>
        </div>

        <div className="absolute bottom-20 left-20 p-4 bg-green-50 rounded-full opacity-80 hidden lg:block">
          <span className="text-green-300"><Clock /></span>
        </div>

        <div className="absolute bottom-20 right-20 p-4 bg-yellow-50 rounded-full opacity-80 hidden lg:block">
          <span className="text-yellow-300"><Mail /></span>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto text-center mt-24 mb-16 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your <span className="text-blue-500">AI Models Hub</span> on Filecoin
          </h1>
          <p className="text-gray-600 mb-10">
            Share, discover and use AI models with verified provenance.
            <br />
            Secure storage on Filecoin for transparent AI development.
          </p>

          {/* Connect Wallet Button */}
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-md text-lg font-medium h-10"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="max-w-4xl mx-auto border-t border-gray-200 mt-16"></div>
      </main>

      <Details />
    </div>
  );
};

export default Home;