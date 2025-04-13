import { ethers } from 'ethers';

// The network details for Filecoin-compatible networks
const SUPPORTED_NETWORKS = {
  // For development - Filecoin Calibration testnet
  314159: {
    name: 'Filecoin Calibration',
    rpcUrl: 'https://api.calibration.node.glif.io/rpc/v1',
    blockExplorer: 'https://calibration.filfox.info/en'
  },
  // Mainnet
  314: {
    name: 'Filecoin Mainnet',
    rpcUrl: 'https://api.node.glif.io/rpc/v1',
    blockExplorer: 'https://filfox.info/en'
  }
};

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private currentChainId: number | null = null;

  getCurrentChainId(): number | null {
    return this.currentChainId;
  }
  
  // Check if wallet is installed
  hasWallet(): boolean {
    return typeof (window as any).ethereum !== 'undefined';
  }
  
  // Request account access and get provider
  async connectWallet(): Promise<string | null> {
    try {
      if (!this.hasWallet()) {
        throw new Error('No Ethereum wallet found. Please install MetaMask.');
      }
      
      // Request account access
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        this.provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Get current chain ID
        this.currentChainId = Number(
          await (window as any).ethereum.request({ method: 'eth_chainId' })
        );
        
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }
  
  // Check if connected to correct network
  async isOnSupportedNetwork(): Promise<boolean> {
    if (!this.currentChainId) {
      try {
        this.currentChainId = Number(
          await (window as any).ethereum.request({ method: 'eth_chainId' })
        );
      } catch (error) {
        return false;
      }
    }
    
    return Object.keys(SUPPORTED_NETWORKS).includes(this.currentChainId.toString());
  }
  
  // Switch to a supported network
  async switchToSupportedNetwork(): Promise<boolean> {
    try {
      if (!this.hasWallet()) return false;
      
      // Default to Filecoin Calibration testnet for development
      const targetChain = 314159; // Calibration testnet
      
      // Try to switch to the network
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChain.toString(16)}` }]
        });
        
        this.currentChainId = targetChain;
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          const network = SUPPORTED_NETWORKS[targetChain as keyof typeof SUPPORTED_NETWORKS];
          
          // Add the network
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChain.toString(16)}`,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer],
              nativeCurrency: {
                name: 'Filecoin',
                symbol: 'FIL',
                decimals: 18
              }
            }]
          });
          
          this.currentChainId = targetChain;
          return true;
        }
        
        throw switchError;
      }
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }
  
  // Register network change handlers
  registerNetworkHandlers(onNetworkChange: (chainId: number) => void): void {
    if (this.hasWallet()) {
      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        this.currentChainId = Number(chainId);
        onNetworkChange(this.currentChainId);
      });
    }
  }
}

export const walletService = new WalletService();