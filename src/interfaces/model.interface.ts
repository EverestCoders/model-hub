export interface ModelFileInfo {
  filename: string;
  path?: string;
  sizeBytes: number;
  mimeType?: string;
}

export interface ModelFilter {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  category?: string;
  tag?: string;
  license?: string;
  creator?: string;
}

export interface ModelCreateDto {
  name: string;
  description?: string;
  licenseType?: string;
  commercialUse?: boolean;
  attributionRequired?: boolean;
  royaltyPercentage?: number;
  category?: string;
  tags?: string;
  parameters?: number;
  modelFile: Express.Multer.File | Express.Multer.File[];
}

export interface VersionCreateDto {
  commitMessage?: string;
  parameters?: number;
  modelFile: Express.Multer.File | Express.Multer.File[];
}

export interface ModelResponse {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  creatorName: string | null;
  createdAt: string;
  licenseType: string;
  category: string | null;
  downloadCount: number;
  ratingAvg: number | null;
  latestVersion: {
    versionNumber: number;
    createdAt: string;
  } | null;
}

export interface ModelDetailResponse {
  id: string;
  name: string;
  description: string | null;
  creator: {
    id: string;
    username: string | null;
    walletAddress: string;
  };
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
  latestVersion: {
    id: string;
    versionNumber: number;
    filecoinCid: string;
    commitMessage: string | null;
    createdAt: string;
    sizeBytes: number | null;
    parameters: number | null;
    files: ModelFileInfo[];
  } | null;
  ratings: Array<{
    rating: number;
    review: string | null;
    userId: string;
    username: string | null;
    createdAt: string;
  }>;
}

export interface ModelVersionResponse {
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
  metadata: {
    [key: string]: any;
  };
  storage: {
    activeDeals: number;
    totalDeals: number;
  };
  files: ModelFileInfo[];
}

export interface DownloadResponse {
  downloadUrl: string;
  modelName: string;
  version: number;
  filecoinCid: string;
}

export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
