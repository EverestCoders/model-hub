import { ethers } from 'ethers';
import { CONTRACTS } from '../../../abi/config';
import { transactionService } from './transaction.service';

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  
  // Initialize connection to blockchain
  async connect(): Promise<boolean> {
    try {
      // Check if window.ethereum exists (MetaMask or similar wallet)
      if (!(window as any).ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask.');
      }
      
      // Create provider
      this.provider = new ethers.BrowserProvider((window as any).ethereum);

      const network = await this.provider.getNetwork();
      console.log("network:", network);
      console.log("Connected to network:", {
        name: network.name,
        chainId: Number(network.chainId)
      });
      
      // Get the signer (user's account)
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      console.log("Using address:", address);

      const contractCode = await this.provider.getCode(CONTRACTS.MODELHUB.address);
      if (contractCode === '0x') {
        console.error(`No contract deployed at address: ${CONTRACTS.MODELHUB.address}`);
        return false;
      }

      console.log(`Contract exists at: ${CONTRACTS.MODELHUB.address}`);
      
      // Initialize contract
      this.contract = new ethers.Contract(
        CONTRACTS.MODELHUB.address,
        CONTRACTS.MODELHUB.abi,
        this.signer
      );

      console.log("Contract:", this.contract);
      console.log("Contract interface fragments:", this.contract.interface.fragments);

      console.log("simplest call");
      // const simpleCall = await this.contract.getModelDetails();
      // console.log("Simple call result:", simpleCall);

      try {
        const modelCounter = await this.contract.modelCounter();
        console.log("Contract is accessible. Current model counter:", modelCounter);
      } catch (callError) {
        console.error("Error calling contract view function:", callError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      return false;
    }
  }
  
  // Check if currently connected
  isConnected(): boolean {
    return this.contract !== null && this.signer !== null;
  }
  
  // Get current wallet address
  async getCurrentAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }
  
  async registerModel(
    userId: string,
    baseCID: string,
    metadataCID: string,
    licenseType: string,
    accessFee: number,
    isCommercial: boolean,
    modelType: string,
    baseModelId: number = 0,
    dealId: number = 0
  ): Promise<{ success: boolean; modelId?: number; txHash?: string; error?: string }> {
    try {
      if (!this.contract || !this.signer) {
        await this.connect();
        if (!this.contract || !this.signer) {
          throw new Error('Not connected to blockchain');
        }
      }
      
      // Convert parameters to appropriate types
      const accessFeeWei = ethers.parseEther(accessFee.toString());
      
      // Log parameters for debugging
      console.log("Calling registerModel with params:", {
        userId,
        baseCID,
        metadataCID,
        licenseType,
        accessFeeWei: accessFeeWei.toString(),
        isCommercial,
        modelType,
        baseModelId,
        dealId
      });
      
      // Check if the method exists
      console.log("Contract methods:", Object.keys(this.contract.interface.getFunction));
      
      // Call contract method with explicit error handling
      let tx;
      try {
        tx = await this.contract.registerModel(
          userId,
          baseCID,
          metadataCID,
          licenseType,
          accessFeeWei,
          isCommercial,
          modelType,
          baseModelId,
          dealId
        );
        console.log("Transaction initiated:", tx);
      } catch (contractError: any) {
        console.error("Contract call error:", contractError);
        return { 
          success: false, 
          error: `Contract call failed: ${contractError.message || 'Unknown error'}` 
        };
      }
      
      // Wait for transaction to be mined
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Extract model ID from events (if available)
      let modelId;
      if (receipt && receipt.logs) {
        console.log("Transaction logs:", receipt.logs);
        
        // Find the ModelRegistered event and extract modelId
        for (const log of receipt.logs) {
          try {
            const parsedLog = this.contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            console.log("Parsed log:", parsedLog);
            if (parsedLog && parsedLog.name === 'ModelRegistered') {
              modelId = parsedLog.args[0];
              console.log("Found modelId in event:", modelId);
              break;
            }
          } catch (e) {
            console.log("Error parsing log:", e);
            // Skip logs that aren't from our contract
          }
        }
      }
      
      return { 
        success: true, 
        modelId: modelId ? Number(modelId) : undefined, 
        txHash: receipt.hash 
      };
    } catch (error: any) {
      console.error('Error registering model on blockchain:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      };
    }
  }
  // Get a user's models
async getUserModels(userId: string): Promise<number[]> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    const modelIds = await this.contract.getUserModels(userId);
    return modelIds.map((id: ethers.BigNumberish) => Number(id));
  } catch (error: any) {
    console.error('Error getting user models:', error);
    throw error;
  }
}

// Get model details
async getModelDetails(modelId: number): Promise<any> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    const details = await this.contract.getModelDetails(modelId);
    
    return {
      owner: details[0],
      baseCID: details[1],
      metadataCID: details[2],
      creationTime: Number(details[3]) * 1000, // Convert to milliseconds
      licenseType: details[4],
      accessFee: ethers.formatEther(details[5]),
      isCommercial: details[6],
      modelType: details[7],
      version: Number(details[8]),
      baseModelId: Number(details[9])
    };
  } catch (error: any) {
    console.error('Error getting model details:', error);
    throw error;
  }
}

// Update model details
async updateModelDetails(
  modelId: number,
  licenseType: string,
  accessFee: number,
  isCommercial: boolean
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    // Convert parameters to appropriate types
    const accessFeeWei = ethers.parseEther(accessFee.toString());
    
    // Create transaction in tracking system
    const txId = transactionService.addTransaction(`Updating model #${modelId}`);
    
    // Call contract method
    const tx = await this.contract.updateModelDetails(
      modelId,
      licenseType,
      accessFeeWei,
      isCommercial
    );
    
    // Update transaction with hash
    transactionService.updateTransactionHash(txId, tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Mark transaction as confirmed
    transactionService.confirmTransaction(txId);
    
    return { 
      success: true, 
      txHash: receipt.hash 
    };
  } catch (error: any) {
    console.error('Error updating model details:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
}

// Purchase access to a model
async purchaseAccess(
  modelId: number,
  price: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    // Convert price to wei
    const priceWei = ethers.parseEther(price);
    
    // Create transaction in tracking system
    const txId = transactionService.addTransaction(`Purchasing access to model #${modelId}`);
    
    // Call contract method
    const tx = await this.contract.purchaseAccess(modelId, {
      value: priceWei
    });
    
    // Update transaction with hash
    transactionService.updateTransactionHash(txId, tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Mark transaction as confirmed
    transactionService.confirmTransaction(txId);
    
    return { 
      success: true, 
      txHash: receipt.hash 
    };
  } catch (error: any) {
    console.error('Error purchasing access:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
}

async getModelPaymentsCount(modelId: number): Promise<number> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    const count = await this.contract.getModelPaymentsCount(modelId);
    return Number(count);
  } catch (error: any) {
    console.error('Error getting payment count:', error);
    return 0;
  }
}

async getModelPaymentAt(modelId: number, index: number): Promise<any> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    return await this.contract.getModelPaymentAt(modelId, index);
  } catch (error: any) {
    console.error('Error getting payment details:', error);
    throw error;
  }
}

async findModelByCID(cid: string): Promise<number | null> {
  try {
    if (!this.contract || !this.signer) {
      await this.connect();
      if (!this.contract || !this.signer) {
        throw new Error('Not connected to blockchain');
      }
    }
    
    // Use the cidToModelId mapping from your updated contract
    const modelId = await this.contract.cidToModelId(cid);
    
    // If no model is found, this will return 0 in Solidity
    if (modelId.toString() === '0') {
      return null;
    }
    
    return Number(modelId);
  } catch (error) {
    console.error('Error finding model by CID:', error);
    return null;
  }
}
}

export const blockchainService = new BlockchainService();