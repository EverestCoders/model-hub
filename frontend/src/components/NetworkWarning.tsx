import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface NetworkWarningProps {
  isCorrectNetwork: boolean;
  networkName: string | null;
  onSwitchNetwork: () => Promise<boolean>;
}

export const NetworkWarning: React.FC<NetworkWarningProps> = ({
  isCorrectNetwork,
  networkName,
  onSwitchNetwork
}) => {
  const [isSwitching, setIsSwitching] = React.useState(false);
  
  if (isCorrectNetwork) {
    return null;
  }
  
  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await onSwitchNetwork();
    } finally {
      setIsSwitching(false);
    }
  };
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Wrong Network Detected</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          You are currently connected to {networkName || 'an unsupported network'}.
          To interact with the Everest Model Hub, please switch to Filecoin Calibration Testnet.
        </p>
        <Button 
          onClick={handleSwitchNetwork} 
          disabled={isSwitching}
          size="sm"
        >
          {isSwitching ? 'Switching...' : 'Switch Network'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};