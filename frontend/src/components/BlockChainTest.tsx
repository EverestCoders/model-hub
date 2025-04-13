import React from 'react';
import { useBlockchain } from '../contexts/BlockChainContext';
import { Button } from './ui/button';
import { NetworkWarning } from './NetworkWarning';

export const BlockchainTest: React.FC = () => {
  const {
    isConnected,
    walletAddress,
    networkName,
    isCorrectNetwork,
    error,
    connectWallet,
    switchNetwork,
  } = useBlockchain();

  return (
    <div className="p-4 border rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Blockchain Connection Test</h2>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
      
      <NetworkWarning 
        isCorrectNetwork={isCorrectNetwork}
        networkName={networkName}
        onSwitchNetwork={switchNetwork}
      />
      
      <div className="space-y-2 mb-4">
        <div><strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div><strong>Wallet Address:</strong> {walletAddress || 'None'}</div>
        <div><strong>Network:</strong> {networkName || 'Unknown'}</div>
        <div><strong>On Correct Network:</strong> {isCorrectNetwork ? 'Yes' : 'No'}</div>
      </div>
      
      {!isConnected ? (
        <Button onClick={() => connectWallet()}>Connect Wallet</Button>
      ) : !isCorrectNetwork ? (
        <Button onClick={() => switchNetwork()}>Switch Network</Button>
      ) : (
        <div className="p-2 bg-green-100 text-green-800 rounded">
          Ready for blockchain interactions!
        </div>
      )}
    </div>
  );
};