import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { PurchaseModelButton } from './PurchaseModelButton';

interface ModelHeaderProps {
  model: any;
  user: any;
  showVersionForm: boolean;
  setShowVersionForm: (show: boolean) => void;
  handleDownload: () => void;
  hasPurchased: boolean;
  blockchainInfo: {
    loading: boolean;
    onChain: boolean;
    modelId: number | null;
    details: any | null;
    error: string | null;
  };
  onPurchaseSuccess: () => void;
}

export const ModelHeader: React.FC<ModelHeaderProps> = ({
  model,
  user,
  showVersionForm,
  setShowVersionForm,
  handleDownload,
  hasPurchased,
  blockchainInfo,
  onPurchaseSuccess
}) => {
  const getCategoryIcon = (category: string | null): string => {
    switch (category?.toLowerCase()) {
      case 'language': return '🔤';
      case 'diffusion': return '🎨';
      case 'audio': return '🔊';
      case 'video': return '🎬';
      case '3d': return '🧊';
      case 'vision': return '👁️';
      default: return '📦';
    }
  };

  // Determine if the current user is the model owner
  const isOwner = user && model.creator.id === user.id;
  
  // Determine if the model requires payment and if the user hasn't purchased it yet
  const requiresPurchase = blockchainInfo.onChain && 
                          blockchainInfo.details && 
                          Number(blockchainInfo.details.accessFee) > 0 && 
                          !hasPurchased && 
                          !isOwner;

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="text-sm text-muted-foreground mb-4">
        <Link to="/models" className="hover:underline">Explore</Link> / <span>AI Models</span> / <span>{model.name}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
            <span>{getCategoryIcon(model.category)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{model.name}</h1>
            <p className="text-muted-foreground">
              by {model.creator.username || model.creator.walletAddress.substring(0, 8) + '...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Show Add Version button only for the model owner */}
          {isOwner && (
            <Button 
              variant={showVersionForm ? "outline" : "secondary"}
              onClick={() => setShowVersionForm(!showVersionForm)}
            >
              {showVersionForm ? (
                <>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" /> Add Version
                </>
              )}
            </Button>
          )}

          {/* Display Purchase button or Download button */}
          {requiresPurchase ? (
            <PurchaseModelButton
              modelId={blockchainInfo.modelId || 0}
              price={blockchainInfo.details.accessFee.toString()}
              modelName={model.name}
              ownerAddress={blockchainInfo.details.owner}
              onSuccess={onPurchaseSuccess}
            />
          ) : (
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleDownload}
            >
              Download
            </Button>
          )}
        </div>
      </div>
    </>
  );
};