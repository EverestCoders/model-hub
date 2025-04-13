import { useState, useEffect, useCallback } from 'react';
import { blockchainService } from '../services/blockchain.service';
import { walletService } from '../services/wallet.service';
import { transactionService, Transaction } from '../services/transaction.service';

interface BlockchainConnectionState {
  isConnected: boolean;
  walletAddress: string | null;
  networkName: string | null;
  isCorrectNetwork: boolean;
  transactions: Transaction[];
  isInitializing: boolean;
  error: string | null;
}

export function useBlockchainConnection() {
  const [state, setState] = useState<BlockchainConnectionState>({
    isConnected: false,
    walletAddress: null,
    networkName: null,
    isCorrectNetwork: false,
    transactions: [],
    isInitializing: true,
    error: null
  });

  // Get supported network name based on chain ID
  const getNetworkName = (chainId: number | null): string | null => {
    if (!chainId) return null;
    
    const networks: Record<number, string> = {
      314159: 'Filecoin Calibration Testnet',
      314: 'Filecoin Mainnet'
    };
    
    return networks[chainId] || 'Unknown Network';
  };

  // Initialize connection
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitializing: true, error: null }));
      
      // Check if wallet is available
      if (!walletService.hasWallet()) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
          error: 'No Ethereum wallet detected. Please install MetaMask.'
        }));
        return;
      }

      // Connect to wallet silently (if previously connected)
      const walletAddress = await walletService.connectWallet();
      
      if (!walletAddress) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isConnected: false
        }));
        return;
      }
      
      // Check network
      const isCorrectNetwork = await walletService.isOnSupportedNetwork();
      
      // Connect to blockchain
      const connected = await blockchainService.connect();
      
      // Get transactions
      const transactions = transactionService.getTransactions();
      
      setState({
        isConnected: connected,
        walletAddress,
        networkName: getNetworkName(walletService.getCurrentChainId()),
        isCorrectNetwork,
        transactions,
        isInitializing: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to initialize blockchain connection:', error);
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // Connect wallet manually
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitializing: true, error: null }));
      
      // Connect to wallet
      const walletAddress = await walletService.connectWallet();
      
      if (!walletAddress) {
        throw new Error('Failed to connect wallet');
      }
      
      // Check network
      const isCorrectNetwork = await walletService.isOnSupportedNetwork();
      
      // Connect to blockchain
      const connected = await blockchainService.connect();
      
      setState(prev => ({
        ...prev,
        isConnected: connected,
        walletAddress,
        networkName: getNetworkName(walletService.getCurrentChainId()),
        isCorrectNetwork,
        isInitializing: false,
        error: null
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async () => {
    try {
      const switched = await walletService.switchToSupportedNetwork();
      
      if (!switched) {
        throw new Error('Failed to switch network');
      }
      
      setState(prev => ({
        ...prev,
        isCorrectNetwork: true,
        networkName: getNetworkName(walletService.getCurrentChainId())
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // Handle network changes
  useEffect(() => {
    const handleNetworkChange = (chainId: number) => {
      const isCorrectNetwork = [314, 314159].includes(chainId);
      setState(prev => ({
        ...prev,
        networkName: getNetworkName(chainId),
        isCorrectNetwork
      }));
    };
    
    // Register for network changes
    walletService.registerNetworkHandlers(handleNetworkChange);
    
    // Register for wallet account changes
    if (walletService.hasWallet()) {
      const ethereum = (window as any).ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setState(prev => ({
            ...prev,
            isConnected: false,
            walletAddress: null
          }));
        } else if (accounts[0] !== state.walletAddress) {
          // User switched account
          setState(prev => ({
            ...prev,
            walletAddress: accounts[0]
          }));
        }
      };
      
      ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [state.walletAddress]);

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (transactions: Transaction[]) => {
      setState(prev => ({ ...prev, transactions }));
    };
    
    transactionService.addListener(handleTransactionUpdate);
    
    return () => {
      transactionService.removeListener(handleTransactionUpdate);
    };
  }, []);

  // Initialize on first load
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    connectWallet,
    switchNetwork,
    refreshConnection: initialize
  };
}