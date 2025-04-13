import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { modelService } from "../services/model.service";
import ModelFileExplorer from "./ModelFileExplorer";
import { useBlockchain } from "../contexts/BlockChainContext";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";

import { ModelHeader } from "./model-details/ModelHeader";
import { ModelMetadata } from "./model-details/ModelMetadata";
import { ModelTabs } from "./model-details/ModelTabs";
import { ModelRatings } from "./model-details/ModelRatings";
import { BlockchainVerification } from "./model-details/BlockchainVerification";
import VersionUpdateForm from "./VersionUpdateForm";

export default function ModelDetails() {
  const { getModelDetails, findModelByCID, getModelPaymentAt, getModelPaymentsCount  } = useBlockchain();
  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [readme, setReadme] = useState<string | null>(null);
  const [config, setConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("readme");
  const [showVersionForm, setShowVersionForm] = useState<boolean>(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false); 
  const [blockchainInfo, setBlockchainInfo] = useState<{
    loading: boolean;
    onChain: boolean;
    modelId: number | null;
    details: any | null;
    error: string | null;
  }>({
    loading: false,
    onChain: false,
    modelId: null,
    details: null,
    error: null
  });

  const token = localStorage.getItem('auth_token'); 
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Verify on blockchain
  const verifyOnBlockchain = async () => {
    if (!model) return;
    
    setBlockchainInfo(prev => ({ ...prev, loading: true, error: null }));
    
    try {

      // Use the mapping function to find model by CID
      const modelId = await findModelByCID(model.latestVersion.filecoinCid);

      if (!modelId) {
        setBlockchainInfo({
          loading: false,
          onChain: false,
          modelId: null,
          details: null,
          error: "Model not found on blockchain"
        });
        return;
      }

      // Get blockchain details
      const details = await getModelDetails(modelId);
      console.log("Blockchain details:", details);
      
      setBlockchainInfo({
        loading: false,
        onChain: true,
        modelId,
        details,
        error: null
      });
    } catch (error) {
      console.error("Blockchain verification error:", error);
      setBlockchainInfo({
        loading: false,
        onChain: false,
        modelId: null,
        details: null,
        error: error instanceof Error ? error.message : "Failed to verify on blockchain"
      });
    }
  };
  
  // Format utility functions
  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle download
  const handleDownload = async () => {
    try {
      if (!id) return;
      
      const response = await modelService.downloadModel(id);
      window.open(response.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading model:", err);
    }
  };

  // Handle version view
  const handleVersionView = (modelId: string, versionId: string) => {
    if (!modelId) return;
    
    // Set the selected version ID when viewing a specific version
    setSelectedVersionId(versionId);
    
    // Set README and config to show this specific version
    modelService.getModelReadme(modelId, versionId).then(
      data => setReadme(data.content)
    ).catch(() => setReadme(null));
    
    modelService.getModelConfig(modelId, versionId).then(
      data => setConfig(data.content)
    ).catch(() => setConfig(null));
    
    // Switch to README tab to show content
    setActiveTab("readme");
  };

  // Handle version download
  const handleVersionDownload = (modelId: string, versionId: string) => {
    if (!modelId) return;
    
    modelService.downloadModel(modelId, versionId).then(
      response => window.open(response.downloadUrl, "_blank")
    ).catch(err => {
      console.error("Error downloading version:", err);
    });
  };

  // Refresh data
  const refreshData = async () => {
    try {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch model details
      const modelData = await modelService.getModelById(id);
      setModel(modelData);
  
      // Fetch versions
      const versionsData = await modelService.getModelVersions(id);
      setVersions(versionsData.versions);
      
      // Fetch README if available
      try {
        const readmeData = await modelService.getModelReadme(id);
        setReadme(readmeData.content);
      } catch (err) {
        console.log("No README found");
      }
  
      // Fetch config if available
      try {
        const configData = await modelService.getModelConfig(id);
        setConfig(configData.content);
      } catch (err) {
        console.log("No config found");
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!blockchainInfo.onChain || !blockchainInfo.modelId || !user) {
      return false;
    }
    
    try {
      const paymentsCount = await getModelPaymentsCount(blockchainInfo.modelId);
      
      // Check through all payments to see if any are from this user
      for (let i = 0; i < paymentsCount; i++) {
        const payment = await getModelPaymentAt(blockchainInfo.modelId, i);
        
        // Check if this payment was made by the current user
        if (payment && payment[0] && 
            user.walletAddress && 
            payment[0].toLowerCase() === user.walletAddress.toLowerCase()) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking purchase status:", error);
      return false;
    }
  };

  const handlePurchaseSuccess = () => {
    setHasPurchased(true);
    refreshData();
  };

  // Initial data loading
  useEffect(() => {
    const fetchModelDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error("Model ID is missing");
        }

        // Fetch model details
        const modelData = await modelService.getModelById(id);
        setModel(modelData);

        // Fetch versions
        const versionsData = await modelService.getModelVersions(id);
        setVersions(versionsData.versions);

        // Fetch README if available
        try {
          const readmeData = await modelService.getModelReadme(id);
          setReadme(readmeData.content);
        } catch (err) {
          console.log("No README found");
        }

        // Fetch config if available
        try {
          const configData = await modelService.getModelConfig(id);
          setConfig(configData.content);
        } catch (err) {
          console.log("No config found");
        }
      } catch (err) {
        console.error("Error fetching model details:", err);
        setError("Failed to load model details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchModelDetails();
    }
  }, [id]);

  // Verify on blockchain when model is loaded
  useEffect(() => {
    if (model?.latestVersion?.filecoinCid) {
      verifyOnBlockchain();
    }
  }, [model?.id]);

  useEffect(() => {
    if (blockchainInfo.onChain && blockchainInfo.modelId && user) {
      checkPurchaseStatus().then(purchased => {
        setHasPurchased(purchased);
      });
    }
  }, [blockchainInfo.onChain, blockchainInfo.modelId, user]);

  if (loading) {
    return <div className="container mx-auto py-8">Loading model details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              {/* Header Section */}
              <ModelHeader
                model={model}
                user={user}
                showVersionForm={showVersionForm}
                setShowVersionForm={setShowVersionForm}
                handleDownload={handleDownload}
                hasPurchased={hasPurchased}
                blockchainInfo={blockchainInfo}
                onPurchaseSuccess={handlePurchaseSuccess}
              />

              {/* Version Update Form */}
              {showVersionForm && (
                <div className="mb-8">
                  <VersionUpdateForm 
                    modelId={model.id} 
                    onSuccess={() => {
                      setShowVersionForm(false);
                      refreshData();
                    }}
                    onCancel={() => setShowVersionForm(false)}
                  />
                </div>
              )}

              {/* Model Metadata */}
              <ModelMetadata
                model={model}
                formatBytes={formatBytes}
                formatDate={formatDate}
                formatNumber={formatNumber}
              />

              {/* Tabs Section */}
              <ModelTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                readme={readme}
                config={config}
                versions={versions}
                model={model}
                selectedVersionId={selectedVersionId}
                setSelectedVersionId={setSelectedVersionId}
                formatBytes={formatBytes}
                formatNumber={formatNumber}
                formatDate={formatDate}
                handleVersionView={handleVersionView}
                handleVersionDownload={handleVersionDownload}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <ModelFileExplorer 
            modelId={model.id} 
            versionId={model.latestVersion?.id || ""} 
            files={model.latestVersion?.files || []}
          />
          
          {/* Ratings Section */}
          <ModelRatings ratings={model.ratings} />
          
          {/* Blockchain Verification */}
          <div className="mt-4">
            <h3 className="font-medium mb-3">Blockchain Verification</h3>
            <BlockchainVerification 
              blockchainInfo={blockchainInfo}
              verifyOnBlockchain={verifyOnBlockchain}
            />
          </div>
        </div>
      </div>
    </div>
  );
}