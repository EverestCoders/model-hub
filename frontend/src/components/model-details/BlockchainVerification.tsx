import React from 'react';
import { Shield, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ethers } from 'ethers';

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
      <div className="p-6 bg-gray-50 rounded-lg border flex flex-col items-center justify-center">
        <div className="bg-white p-4 rounded-full shadow-md mb-3">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
        <p className="text-gray-700 font-medium">Verifying on blockchain...</p>
        <p className="text-gray-500 text-sm mt-1">This may take a few moments</p>
      </div>
    );
  }
  
  if (blockchainInfo.error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-3">
          <div className="bg-white p-2 rounded-full shadow-sm mr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-red-700 font-medium">Verification Failed</p>
        </div>
        <p className="text-sm text-red-600 mb-4">{blockchainInfo.error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={verifyOnBlockchain} 
          className="border-red-200 hover:bg-red-50 text-red-700"
        >
          Retry Verification
        </Button>
      </div>
    );
  }
  
  if (blockchainInfo.onChain) {
    return (
      <div className="overflow-hidden rounded-lg border border-green-200 shadow-sm">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-100">
          <div className="flex items-center mb-2">
            <div className="bg-white p-2 rounded-full shadow-sm mr-3">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <p className="font-medium text-green-800">Verified on Blockchain</p>
          </div>
        </div>
        
        <div className="p-4 bg-white">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Chain ID:</span>
              <span className="font-medium text-gray-900">#{blockchainInfo.modelId}</span>
            </div>
            
            {blockchainInfo.details && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Owner:</span>
                  <Badge variant="outline" className="font-mono">
                    {blockchainInfo.details.owner.substring(0, 8)}...
                  </Badge>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">License:</span>
                  <Badge className="bg-blue-100 text-blue-800 border-none">
                    {blockchainInfo.details.licenseType}
                  </Badge>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Registered:</span>
                  <span className="text-gray-900">
                    {new Date(blockchainInfo.details.creationTime).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Access Fee:</span>
                  <Badge className={`${Number(blockchainInfo.details.accessFee) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} border-none`}>
                    {(blockchainInfo.details.accessFee)} FIL
                  </Badge>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4 flex justify-center">
            <a 
              href={`https://calibration.filfox.info/en/address/${blockchainInfo.details?.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
            >
              View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-center mb-3">
        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        </div>
        <p className="font-medium text-yellow-800">Not Verified</p>
      </div>
      <p className="text-sm text-yellow-700 mb-4">
        This model hasn't been verified on the blockchain yet. Verification ensures authenticity and provenance.
      </p>
      <Button 
        variant="default" 
        size="sm" 
        onClick={verifyOnBlockchain} 
        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
      >
        Verify on Blockchain
      </Button>
    </div>
  );
};