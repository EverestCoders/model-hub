const API_BASE_URL = 'http://localhost:3002'; // Adjust to your backend URL

interface NonceResponse {
  nonce: string;
  expiresAt: number;
}

interface ConnectResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    username: string | null;
  };
}

export const authService = {
  /**
   * Request a nonce for wallet authentication
   */
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/nonce/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to get nonce');
    }
    
    return response.json();
  },

  /**
   * Connect wallet with signature
   */
  async connectWallet(walletAddress: string, signature: string): Promise<ConnectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, signature }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to connect wallet');
    }
    
    return response.json();
  },

  /**
   * Register a new user
   */
  async register(walletAddress: string, signature: string, username?: string, bio?: string): Promise<ConnectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        username,
        bio,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register user');
    }
    
    return response.json();
  }
};