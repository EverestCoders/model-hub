import React from 'react';
import { Transaction } from '../services/transaction.service';

interface TransactionQueueProps {
  transactions: Transaction[];
}

export const TransactionQueue: React.FC<TransactionQueueProps> = ({ transactions }) => {
  // Only show recent transactions (last 24 hours)
  const recentTransactions = transactions.filter(
    tx => Date.now() - tx.createdAt < 24 * 60 * 60 * 1000
  );
  
  if (recentTransactions.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium">Recent Transactions</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {recentTransactions.map(tx => (
          <div 
            key={tx.id} 
            className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{tx.description}</span>
              <TransactionStatusBadge status={tx.status} />
            </div>
            
            {tx.hash && (
              <a 
                href={`https://calibration.filfox.info/en/message/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                View on Explorer
              </a>
            )}
            
            {tx.error && (
              <p className="text-xs text-red-500 mt-1">{tx.error}</p>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(tx.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TransactionStatusBadge: React.FC<{ status: Transaction['status'] }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let label = '';
  
  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'Pending';
      break;
    case 'mining':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      label = 'Processing';
      break;
    case 'confirmed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Confirmed';
      break;
    case 'failed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = 'Failed';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};