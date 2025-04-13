import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { modelService } from "../services/model.service";
import ModelFileExplorer from "./ModelFileExplorer";
import { ExternalLink, History, Loader2, Plus, Shield, X } from "lucide-react";
import { Button } from "./ui/button";
import VersionUpdateForm from "./VersionUpdateForm";
import { Badge } from "./ui/badge";
import { useBlockchain } from "../contexts/BlockChainContext";

interface ModelFile {
  filename: string;
  path: string | null;
  sizeBytes: number;
  mimeType: string | null;
}

interface ModelVersion {
  id: string;
  versionNumber: number;
  filecoinCid: string;
  metadataCid: string;
  hash: string;
  parentVersionId: string | null;
  commitMessage: string | null;
  createdAt: string;
  txHash: string | null;
  sizeBytes: number | null;
  parameters: number | null;
  files: ModelFile[];
}

interface ModelRating {
  rating: number;
  review: string | null;
  userId: string;
  username: string | null;
  createdAt: string;
}

interface ModelCreator {
  id: string;
  username: string | null;
  walletAddress: string;
}

interface ModelDetail {
  id: string;
  name: string;
  description: string | null;
  creator: ModelCreator;
  createdAt: string;
  updatedAt: string;
  licenseType: string;
  commercialUse: boolean;
  attributionRequired: boolean;
  royaltyPercentage: number;
  category: string | null;
  tags: string[];
  downloadCount: number;
  ratingAvg: number | null;
  latestVersion: ModelVersion | null;
  ratings: ModelRating[];
}

export default function ModelDetails() {

  const { getModelDetails } = useBlockchain();

  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<ModelDetail | null>(null);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [readme, setReadme] = useState<string | null>(null);
  const [config, setConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("readme");
  const [showVersionForm, setShowVersionForm] = useState<boolean>(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
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

  // Add function to verify on blockchain
  const verifyOnBlockchain = async () => {
    if (!model) return;
    
    setBlockchainInfo(prev => ({ ...prev, loading: true, error: null }));
    //TODO: Add blockchain verification
    try {
      // First, search for the model by CID on the blockchain
      // This would require a backend endpoint to search by CID
      // For now, we'll use a mock implementation
      const modelId = 1; // In a real implementation, this would come from an API call
      
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
      setBlockchainInfo(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to verify on blockchain"
      }));
    }
  };
  
  // Add this to your useEffect to check blockchain status when model loads
  useEffect(() => {
    if (model?.latestVersion?.filecoinCid) {
      verifyOnBlockchain();
    }
  }, [model?.id]);

  const token = localStorage.getItem('auth_token'); 
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

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

  // Add this in your component where appropriate:
  const renderBlockchainInfo = () => {
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

  const handleDownload = async () => {
    try {
      if (!id) return;
      
      const response = await modelService.downloadModel(id);
      window.open(response.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading model:", err);
    }
  };

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

  if (loading) {
    return <div className="container mx-auto py-8">Loading model details...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8">Error: {error}</div>;
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
              {/* Breadcrumb Navigation */}
              <div className="text-sm text-muted-foreground mb-4">
                <span>Explore</span> / <span>AI Models</span> / <span>{model.name}</span>
              </div>

              {/* Header Section */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex gap-4 items-center">
                  <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{getCategoryIcon(model.category)}</span>
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
                  {user && model.creator.id === user.id && (
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

                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </div>
              </div>

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

              {/* Model Details */}
              <div className="space-y-5 mb-8">
                <p className="text-gray-700">
                  {model.description || "No description provided."}
                </p>

                {model.tags && model.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Tags:</span>
                    {model.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    License: <span className="border px-2 py-1 rounded">{model.licenseType}</span>
                    {model.commercialUse && (
                      <span className="ml-2 bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded">
                        Commercial use allowed
                      </span>
                    )}
                    {model.attributionRequired && (
                      <span className="ml-2 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">
                        Attribution required
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {model.latestVersion && (
                    <span className="border px-3 py-1 rounded-full bg-gray-50">
                      Size: {formatBytes(model.latestVersion.sizeBytes)}
                    </span>
                  )}
                  <span className="border px-3 py-1 rounded-full bg-gray-50">
                    Updated: {formatDate(model.updatedAt)}
                  </span>
                  <span className="border px-3 py-1 rounded-full bg-gray-50">
                    Downloads: {model.downloadCount}
                  </span>
                  {model.latestVersion?.parameters && (
                    <span className="border px-3 py-1 rounded-full bg-gray-50">
                      Parameters: {formatNumber(model.latestVersion.parameters)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs Section */}
              <div className="mt-8">
                <div className="border-b">
                  <ul className="flex -mb-px">
                    <li className="mr-2">
                      <button
                        className={`inline-block py-2 px-4 border-b-2 ${
                          activeTab === "readme" ? "border-blue-500 text-blue-600" : "border-transparent"
                        }`}
                        onClick={() => setActiveTab("readme")}
                      >
                        README
                      </button>
                    </li>
                    <li className="mr-2">
                      <button
                        className={`inline-block py-2 px-4 border-b-2 ${
                          activeTab === "config" ? "border-blue-500 text-blue-600" : "border-transparent"
                        }`}
                        onClick={() => setActiveTab("config")}
                      >
                        Configuration
                      </button>
                    </li>
                    <li className="mr-2">
                      <button
                        className={`inline-block py-2 px-4 border-b-2 ${
                          activeTab === "versions" ? "border-blue-500 text-blue-600" : "border-transparent"
                        }`}
                        onClick={() => setActiveTab("versions")}
                      >
                        Versions
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="py-4">
                  {activeTab === "readme" && (
                    <>
                    {readme ? (
                      <div>
                        {/* Add a version indicator if not showing latest version */}
                        {model.latestVersion && model.latestVersion.id !== selectedVersionId && selectedVersionId && (
                          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                            Viewing README for Version {
                              versions.find(v => v.id === selectedVersionId)?.versionNumber || '?'
                            }
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="ml-2" 
                              onClick={() => {
                                // Reset to latest version
                                if (id) {
                                  modelService.getModelReadme(id).then(
                                    data => setReadme(data.content)
                                  );
                                  setSelectedVersionId(null);
                                }
                              }}
                            >
                              View Latest
                            </Button>
                          </div>
                        )}
                        
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
                          <ReactMarkdown>{readme}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                        <p className="text-gray-500">No README file available for this model.</p>
                      </div>
                    )}
                  </>
                  )}

                  {activeTab === "config" && (
                    <>
                      {config ? (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="whitespace-pre-wrap overflow-x-auto text-sm">
                            {config}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border rounded-md p-6 text-center">
                          <p className="text-gray-500">No configuration file available for this model.</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "versions" && (
                    <div className="border rounded-md divide-y">
                      {versions.length > 0 ? (
                        versions.map((version, index) => (
                          <div key={version.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <div className="bg-blue-100 rounded-full p-2 mt-1">
                                  <History className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <h3 className="text-sm font-medium">Version {version.versionNumber}</h3>
                                    {index === 0 && (
                                      <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 text-xs">
                                        Latest
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(version.createdAt)}
                                  </p>
                                  {version.commitMessage && (
                                    <p className="text-sm mt-2">{version.commitMessage}</p>
                                  )}
                                  <div className="flex gap-2 mt-2 text-xs">
                                    <Badge variant="outline" className="bg-gray-50">
                                      {formatBytes(version.sizeBytes)}
                                    </Badge>
                                    {version.parameters && (
                                      <Badge variant="outline" className="bg-gray-50">
                                        {formatNumber(version.parameters)} parameters
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    if (id) {
                                      // Set the selected version ID when viewing a specific version
                                      setSelectedVersionId(version.id);
                                      
                                      // Set README and config to show this specific version
                                      modelService.getModelReadme(id, version.id).then(
                                        data => setReadme(data.content)
                                      ).catch(() => setReadme(null));
                                      
                                      modelService.getModelConfig(id, version.id).then(
                                        data => setConfig(data.content)
                                      ).catch(() => setConfig(null));
                                      
                                      // Switch to README tab to show content
                                      setActiveTab("readme");
                                    }
                                  }}
                                >
                                  View Files
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => {
                                    if (id) {
                                      modelService.downloadModel(id, version.id).then(
                                        response => window.open(response.downloadUrl, "_blank")
                                      );
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No versions available for this model.</p>
          </div>
        )}
  </div>
)}
                </div>
              </div>
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
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
            <h3 className="font-medium mb-3">Ratings</h3>
            {model.ratings && model.ratings.length > 0 ? (
              <div className="space-y-3">
                {model.ratings.slice(0, 3).map((rating, index) => (
                  <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {rating.username || 'Anonymous'}
                      </span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-xs ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {rating.review && (
                      <p className="text-xs text-gray-600 mt-1">{rating.review}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No ratings yet.</p>
            )}
            <h3 className="font-medium mb-3">Blockchain Verification</h3>
            {renderBlockchainInfo()}

          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category: string | null): string {
  switch (category?.toLowerCase()) {
    case 'language':
      return '🔤';
    case 'diffusion':
      return '🎨';
    case 'audio':
      return '🔊';
    case 'video':
      return '🎬';
    case '3d':
      return '🧊';
    case 'vision':
      return '👁️';
    default:
      return '📦';
  }
}