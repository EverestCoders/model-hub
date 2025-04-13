import React from 'react';

interface ModelMetadataProps {
  model: any;
  formatBytes: (bytes: number | null | undefined) => string;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
}

export const ModelMetadata: React.FC<ModelMetadataProps> = ({
  model,
  formatBytes,
  formatDate,
  formatNumber
}) => {
  return (
    <div className="space-y-5 mb-8">
      <p className="text-gray-700">
        {model.description || "No description provided."}
      </p>

      {model.tags && model.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Tags:</span>
          {model.tags.map((tag: string, index: number) => (
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
  );
};