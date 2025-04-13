import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { useBlockchain } from '../../contexts/BlockChainContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface PurchaseModelButtonProps {
  modelId: number;
  price: string; // Price in FIL
  modelName: string;
  ownerAddress: string;
  onSuccess?: () => void;
}

export const PurchaseModelButton: React.FC<PurchaseModelButtonProps> = ({
  modelId,
  price,
  modelName,
  ownerAddress,
  onSuccess
}) => {
  const { purchaseAccess, isConnected, connectWallet, isCorrectNetwork, switchNetwork } = useBlockchain();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Format price for display
  const formattedPrice = parseFloat(price).toFixed(4);
  
  const handlePurchase = async () => {
    try {
      setError(null);
      setIsPurchasing(true);
      
      // Check wallet connection
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          throw new Error("Please connect your wallet to purchase this model");
        }
      }
      
      // Check correct network
      if (!isCorrectNetwork) {
        const switched = await switchNetwork();
        if (!switched) {
          throw new Error("Please switch to the Filecoin network to purchase this model");
        }
      }
      
      // Check if trying to buy own model
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      
      if (user && user.walletAddress?.toLowerCase() === ownerAddress.toLowerCase()) {
        throw new Error("You can't purchase access to your own model");
      }
      
      // Call the purchase method
      const result = await purchaseAccess(modelId, price);
      
      if (!result.success) {
        throw new Error(result.error || "Transaction failed");
      }
      
      // Handle success
      setSuccess(true);
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err instanceof Error ? err.message : "Failed to purchase model access");
    } finally {
      setIsPurchasing(false);
    }
  };
  
  if (success) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
        <Check className="h-4 w-4" />
        <AlertTitle>Purchase Successful!</AlertTitle>
        <AlertDescription>
          You now have access to {modelName}. You can download it now.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handlePurchase} 
        disabled={isPurchasing}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isPurchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>Purchase Access ({formattedPrice} FIL)</>
        )}
      </Button>
    </div>
  );
};