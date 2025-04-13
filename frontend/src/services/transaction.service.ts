export type TransactionStatus = 'pending' | 'mining' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  hash?: string;
  description: string;
  status: TransactionStatus;
  createdAt: number;
  confirmedAt?: number;
  error?: string;
  confirmations?: number;
}

export class TransactionService {
  private transactions: Transaction[] = [];
  private listeners: ((transactions: Transaction[]) => void)[] = [];
  
  // Add a new transaction
  addTransaction(description: string): string {
    const id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const transaction: Transaction = {
      id,
      description,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    this.transactions.push(transaction);
    this.notifyListeners();
    
    return id;
  }
  
  // Update transaction when it's submitted to the blockchain
  updateTransactionHash(id: string, hash: string): void {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.hash = hash;
      transaction.status = 'mining';
      this.notifyListeners();
    }
  }
  
  // Mark transaction as confirmed
  confirmTransaction(id: string, confirmations: number = 1): void {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.status = 'confirmed';
      transaction.confirmations = confirmations;
      transaction.confirmedAt = Date.now();
      this.notifyListeners();
    }
  }
  
  // Mark transaction as failed
  failTransaction(id: string, error: string): void {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.status = 'failed';
      transaction.error = error;
      this.notifyListeners();
    }
  }
  
  // Get all transactions
  getTransactions(): Transaction[] {
    return [...this.transactions];
  }
  
  // Get a specific transaction
  getTransaction(id: string): Transaction | undefined {
    return this.transactions.find(tx => tx.id === id);
  }
  
  // Register a listener for transaction updates
  addListener(listener: (transactions: Transaction[]) => void): void {
    this.listeners.push(listener);
  }
  
  // Remove a listener
  removeListener(listener: (transactions: Transaction[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  // Notify all listeners of changes
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener([...this.transactions]);
    }
  }
  
  // Wait for transaction confirmation (useful in async functions)
  waitForConfirmation(id: string, timeout = 180000): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        const tx = this.getTransaction(id);
        
        if (!tx) {
          clearInterval(checkInterval);
          reject(new Error('Transaction not found'));
          return;
        }
        
        if (tx.status === 'confirmed') {
          clearInterval(checkInterval);
          resolve(tx);
          return;
        }
        
        if (tx.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(tx.error || 'Transaction failed'));
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Transaction confirmation timed out'));
          return;
        }
      }, 2000);
    });
  }
}

export const transactionService = new TransactionService();