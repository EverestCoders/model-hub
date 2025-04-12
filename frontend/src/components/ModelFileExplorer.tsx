import { useState } from "react";
import { modelService } from "../services/model.service";

const fileIcons: Record<string, string> = {
  py: "📄",
  json: "📋",
  txt: "📝",
  md: "📃",
  png: "🖼️",
  jpg: "🖼️",
  bin: "📦",
  safetensors: "📦",
  default: "📄",
};

interface ModelFile {
  filename: string;
  path: string | null;
  sizeBytes: number;
  mimeType: string | null;
}

interface ModelFileNode {
  name: string;
  type: "file" | "folder";
  size?: number;
  extension?: string;
  children?: ModelFileNode[];
}

interface ModelFileExplorerProps {
  modelId: string;
  versionId: string;
  files: ModelFile[];
}

function organizeFiles(files: ModelFile[]): ModelFileNode[] {
  const root: ModelFileNode[] = [];
  const folderMap: Record<string, ModelFileNode> = {};

  const sortedFiles = [...files].sort((a, b) => {
    // sort by path depth
    const aDepth = a.path ? a.path.split('/').length : 1;
    const bDepth = b.path ? b.path.split('/').length : 1;
    if (aDepth !== bDepth) return aDepth - bDepth;
    
    // Then sort alphabetically
    return a.filename.localeCompare(b.filename);
  });

  sortedFiles.forEach((file) => {
    const pathParts = file.path ? file.path.split('/') : [file.filename];
    
    // If it's a root file with no path or just the filename
    if (pathParts.length === 1) {
      const extension = file.filename.split('.').pop() || '';
      root.push({
        name: file.filename,
        type: 'file',
        size: file.sizeBytes,
        extension
      });
      return;
    }

    // Create folder structure
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      if (!folderName) continue;
      
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      
      if (!folderMap[currentPath]) {
        const folder: ModelFileNode = {
          name: folderName,
          type: 'folder',
          children: []
        };
        folderMap[currentPath] = folder;
        currentLevel.push(folder);
      }
      
      currentLevel = folderMap[currentPath].children as ModelFileNode[];
    }

    // Add the file to the current folder
    const fileName = pathParts[pathParts.length - 1];
    const extension = fileName.split('.').pop() || '';
    
    currentLevel.push({
      name: fileName,
      type: 'file',
      size: file.sizeBytes,
      extension
    });
  });

  return root;
}

interface FileItemProps {
  item: ModelFileNode;
  depth?: number;
  modelId: string;
  versionId: string;
}

const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  depth = 0, 
  modelId, 
  versionId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const isFolder = item.type === "folder";
  const extension = item.extension || "default";
  const icon = isFolder 
    ? (isOpen ? "📂" : "📁") 
    : (fileIcons[extension] || fileIcons.default);

  const handleDownload = async (e: React.MouseEvent) => {
    if (isFolder) return;
    
    e.stopPropagation();
    
    try {
      setIsDownloading(true);
      // In a real implementation, you would connect to an endpoint that would
      // allow downloading individual files
      
      // Simulate download with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Downloading ${item.name}`);
      
      setIsDownloading(false);
    } catch (err) {
      console.error("Error downloading file:", err);
      setIsDownloading(false);
    }
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIndent = () => {
    return { paddingLeft: `${depth * 0.75}rem` };
  };

  return (
    <div>
      <div
        className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-sm group"
        style={getIndent()}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        <div className="mr-2">{icon}</div>
        <div className="flex-1 truncate">{item.name}</div>
        {item.size && <div className="text-xs text-gray-500">{formatBytes(item.size)}</div>}
        {!isFolder && (
          <button
            className="ml-2 opacity-0 group-hover:opacity-100 text-xs border px-1.5 py-0.5 rounded hover:bg-gray-100"
            onClick={handleDownload}
          >
            {isDownloading ? "..." : "↓"}
          </button>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileItem key={index} item={child} depth={depth + 1} modelId={modelId} versionId={versionId} />
          ))}
        </div>
      )}
    </div>
  );
};

const ModelFileExplorer: React.FC<ModelFileExplorerProps> = ({ modelId, versionId, files }) => {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  const organizedFiles = organizeFiles(files);
  
  const handleDownloadAll = async () => {
    try {
      setIsDownloadingAll(true);
      const response = await modelService.downloadModel(modelId, versionId);
      window.open(response.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading all files:", err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Calculate total size
  const totalSize = files.reduce((acc, file) => acc + (file.sizeBytes || 0), 0);
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full border rounded-lg shadow-sm bg-white">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-medium">Files</h3>
        <button
          className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll || files.length === 0}
        >
          {isDownloadingAll ? "Downloading..." : "Download All"}
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <div className="p-2">
          {organizedFiles.length > 0 ? (
            organizedFiles.map((item, index) => (
              <FileItem 
                key={index} 
                item={item} 
                modelId={modelId} 
                versionId={versionId}
              />
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No files available for this model version.
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t text-xs text-gray-500">
        Total size: {formatBytes(totalSize)} • {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ModelFileExplorer;