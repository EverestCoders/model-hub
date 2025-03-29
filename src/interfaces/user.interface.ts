export interface User {
    id: string;
    walletAddress: string;
    username?: string | null;
    bio?: string | null;
    avatarCid?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserNonce {
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
  }