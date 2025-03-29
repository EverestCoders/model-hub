export interface NonceRequest {
    walletAddress: string;
  }
  
  export interface NonceResponse {
    nonce: string;
    expiresAt: number;
  }
  
  export interface ConnectRequest {
    walletAddress: string;
    signature: string;
  }
  
  export interface RegisterRequest {
    walletAddress: string;
    signature: string;
    username?: string;
    bio?: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: {
      id: string;
      walletAddress: string;
      username: string | null;
      bio?: string | null;
      createdAt?: string;
    };
  }