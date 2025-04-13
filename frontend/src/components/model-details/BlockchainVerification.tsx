import React from 'react';
import { Shield, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface BlockchainVerificationProps {
  blockchainInfo: {
    loading: boolean;
    onChain: boolean;
    modelId: number | null;
    details: any | null;
    error: string | null;
  };
  verifyOnBlockchain: () => void;
}

export const BlockchainVerification: React.FC<BlockchainVerificationProps> = ({
  blockchainInfo,
  verifyOnBlockchain
}) => {
  if (blockchainInfo.loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border flex items-center">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        <span>Verifying on blockchain...</span>
      </div>
    );
  }
  
  if (blockchainInfo.error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{blockchainInfo.error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={verifyOnBlockchain} 
          className="mt-2"
        >
          Retry Verification
        </Button>
      </div>
    );
  }
  
  if (blockchainInfo.onChain) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center mb-2">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          <span className="font-medium">Verified on Blockchain</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div><strong>Model ID:</strong> {blockchainInfo.modelId}</div>
          {blockchainInfo.details && (
            <>
              <div><strong>Owner:</strong> {blockchainInfo.details.owner.substring(0, 8)}...</div>
              <div><strong>License:</strong> {blockchainInfo.details.licenseType}</div>
              <div><strong>Registered:</strong> {new Date(blockchainInfo.details.creationTime).toLocaleString()}</div>
            </>
          )}
          
          <div className="mt-2">
            <a 
              href={`https://calibration.filfox.info/en/address/${blockchainInfo.details?.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <p className="text-sm">This model hasn't been verified on the blockchain yet.</p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={verifyOnBlockchain} 
        className="mt-2"
      >
        Verify on Blockchain
      </Button>
    </div>
  );
};