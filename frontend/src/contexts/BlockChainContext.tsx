import React, { createContext, useContext, ReactNode } from 'react';
import { useBlockchainConnection } from '../hooks/useBlockChainConnection';
import { Transaction } from '../services/transaction.service';
import { blockchainService } from '../services/blockchain.service';

interface BlockchainContextValue {
  isConnected: boolean;
  walletAddress: string | null;
  networkName: string | null;
  isCorrectNetwork: boolean;
  transactions: Transaction[];
  isInitializing: boolean;
  error: string | null;
  connectWallet: () => Promise<boolean>;
  switchNetwork: () => Promise<boolean>;
  refreshConnection: () => Promise<void>;
  
  // Add blockchain service methods here
  registerModel: (
    userId: string,
    baseCID: string, 
    metadataCID: string,
    licenseType: string,
    accessFee: number,
    isCommercial: boolean,
    modelType: string,
    baseModelId?: number,
    dealId?: number
  ) => Promise<{ success: boolean; modelId?: number; txHash?: string; error?: string }>;
  getUserModels: (userId: string) => Promise<number[]>;
  getModelDetails: (modelId: number) => Promise<any>;
  updateModelDetails: (
    modelId: number,
    licenseType: string,
    accessFee: number,
    isCommercial: boolean
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  purchaseAccess: (
    modelId: number,
    price: string
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  getModelPaymentsCount: (modelId: number) => Promise<number>;
  getModelPaymentAt: (modelId: number, index: number) => Promise<any>;
  findModelByCID: (cid: string) => Promise<number | null>;
}

const BlockchainContext = createContext<BlockchainContextValue | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const connection = useBlockchainConnection();
  
  // Wrap blockchain service methods to ensure connection
  const registerModel = async (
    userId: string,
    baseCID: string, 
    metadataCID: string,
    licenseType: string,
    accessFee: number,
    isCommercial: boolean,
    modelType: string,
    baseModelId = 0,
    dealId = 0
  ) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.registerModel(
      userId,
      baseCID,
      metadataCID,
      licenseType,
      accessFee,
      isCommercial,
      modelType,
      baseModelId,
      dealId
    );
  };

  const getUserModels = async (userId: string) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.getUserModels(userId);
  };
  
  const getModelDetails = async (modelId: number) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.getModelDetails(modelId);
  };

  const updateModelDetails = async (
    modelId: number,
    licenseType: string,
    accessFee: number,
    isCommercial: boolean
  ) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.updateModelDetails(
      modelId,
      licenseType,
      accessFee,
      isCommercial
    );
  };

  const purchaseAccess = async (modelId: number, price: string) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.purchaseAccess(modelId, price);
  };

  const getModelPaymentsCount = async (modelId: number) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.getModelPaymentsCount(modelId);
  };

  const getModelPaymentAt = async (modelId: number, index: number) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.getModelPaymentAt(modelId, index);
  };

  const findModelByCID = async (cid: string) => {
    if (!connection.isConnected) {
      await connection.connectWallet();
    }
    
    if (!connection.isCorrectNetwork) {
      await connection.switchNetwork();
    }
    
    return blockchainService.findModelByCID(cid);
  };
  
  const value: BlockchainContextValue = {
    ...connection,
    registerModel,
    getUserModels,
    getModelDetails,
    updateModelDetails,
    purchaseAccess,
    getModelPaymentsCount,
    getModelPaymentAt,
    findModelByCID
  };
  
  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = (): BlockchainContextValue => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};