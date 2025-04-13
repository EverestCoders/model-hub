import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, Check, WalletIcon } from 'lucide-react';
import { useBlockchain } from '../../contexts/BlockChainContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ethers } from 'ethers';

interface WithdrawFundsButtonProps {
  ownerAddress?: string;
  onSuccess?: () => void;
}

export const WithdrawFundsButton: React.FC<WithdrawFundsButtonProps> = ({
  ownerAddress,
  onSuccess
}) => {
  const { withdrawBalance, isConnected, connectWallet, isCorrectNetwork, switchNetwork, getOwnerBalance } = useBlockchain();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if current user is the owner
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isOwner = user && ownerAddress && user.walletAddress?.toLowerCase() === ownerAddress?.toLowerCase();
  
  // Fetch owner's balance
  const fetchBalance = async () => {
    if (!isOwner || !isConnected) return;
    
    setIsLoading(true);
    try {
      const ownerBalance = await getOwnerBalance(user.walletAddress);
      setBalance(ethers.formatEther(ownerBalance));
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOwner && isConnected) {
      fetchBalance();
    }
  }, [isOwner, isConnected]);
  
  const handleWithdraw = async () => {
    try {
      setError(null);
      setIsWithdrawing(true);
      
      // Check wallet connection
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          throw new Error("Please connect your wallet to withdraw funds");
        }
      }
      
      // Check correct network
      if (!isCorrectNetwork) {
        const switched = await switchNetwork();
        if (!switched) {
          throw new Error("Please switch to the Filecoin network to withdraw funds");
        }
      }
      
      // Call the withdraw method
      const result = await withdrawBalance();
      
      if (!result.success) {
        throw new Error(result.error || "Transaction failed");
      }
      
      // Handle success
      setSuccess(true);
      setBalance("0");
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error("Withdrawal error:", err);
      setError(err instanceof Error ? err.message : "Failed to withdraw funds");
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  // If not the owner or no balance, don't show anything
  if (!isOwner || (balance === "0" && !isLoading)) {
    return null;
  }
  
  if (success) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 mt-4">
        <Check className="h-4 w-4" />
        <AlertTitle>Withdrawal Successful!</AlertTitle>
        <AlertDescription>
          Your funds have been transferred to your wallet.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="mt-4">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="bg-blue-50 p-3 rounded-md flex items-center mb-2">
        <WalletIcon className="h-5 w-5 text-blue-600 mr-2" />
        <div>
          <p className="font-medium text-blue-800">
            Available Balance: {isLoading ? "Loading..." : `${balance} FIL`}
          </p>
          <p className="text-xs text-blue-700">
            You can withdraw this balance to your wallet
          </p>
        </div>
      </div>
      
      <Button 
        onClick={handleWithdraw} 
        disabled={isWithdrawing || isLoading || balance === "0"}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isWithdrawing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Withdrawal...
          </>
        ) : (
          <>Withdraw Funds</>
        )}
      </Button>
    </div>
  );
};