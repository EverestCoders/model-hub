import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

export interface ModelFile {
  filename: string;
  path: string | null;
  sizeBytes: number;
  mimeType: string | null;
}

export interface ModelVersion {
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

export interface ModelFilter {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  category?: string;
  tag?: string;
  license?: string;
  creator?: string;
  query?: string;
}

interface DownloadResponse {
  downloadUrl: string;
  modelName: string;
  version: number;
  filecoinCid: string;
}

interface ReadmeResponse {
  content: string;
}

interface ConfigResponse {
  content: string;
}

export interface ModelVersionsResponse {
  versions: ModelVersion[];
}

export interface ModelData {
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

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ModelsResponse {
  models: ModelData[];
  pagination: PaginationData;
}

export interface RatingResponse {
  success: boolean;
}

export interface VersionCreationResponse {
  modelId: string;
  version: {
    id: string;
    versionNumber: number;
    filecoinCid: string;
    metadataCid: string;
    commitMessage: string | null;
    createdAt: string;
  };
}

export const modelService = {
  async getModels(filters: ModelFilter = {}): Promise<ModelsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.category) params.append('category', filters.category);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.license) params.append('license', filters.license);
      if (filters.creator) params.append('creator', filters.creator);
      if (filters.query) params.append('query', filters.query);
      
      const response = await axios.get(`${API_BASE_URL}/models?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  async getModelById(id: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/models/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching model with ID ${id}:`, error);
      throw error;
    }
  },

  async getModelVersions(id: string): Promise<ModelVersionsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/models/${id}/versions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching versions for model ${id}:`, error);
      throw error;
    }
  },

  async downloadModel(modelId: string, versionId?: string): Promise<DownloadResponse> {
    try {
      const url = versionId 
        ? `${API_BASE_URL}/models/${modelId}/download/${versionId}`
        : `${API_BASE_URL}/models/${modelId}/download`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error downloading model ${modelId}:`, error);
      throw error;
    }
  },

  async getModelReadme(modelId: string, versionId?: string): Promise<ReadmeResponse> {
    try {
      const url = versionId 
        ? `${API_BASE_URL}/models/${modelId}/readme/${versionId}`
        : `${API_BASE_URL}/models/${modelId}/readme`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching README for model ${modelId}:`, error);
      throw error;
    }
  },

  async getModelConfig(modelId: string, versionId?: string): Promise<ConfigResponse> {
    try {
      const url = versionId 
        ? `${API_BASE_URL}/models/${modelId}/config/${versionId}`
        : `${API_BASE_URL}/models/${modelId}/config`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching config for model ${modelId}:`, error);
      throw error;
    }
  },

  async rateModel(modelId: string, rating: number, review?: string): Promise<RatingResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required to rate models');
      }

      const response = await axios.post(
        `${API_BASE_URL}/models/${modelId}/rate`,
        { rating, review },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error rating model ${modelId}:`, error);
      throw error;
    }
  },

  async createModelVersion(modelId: string, versionData: FormData): Promise<VersionCreationResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required to create model versions');
      }
  
      const response = await axios.post(
        `${API_BASE_URL}/models/${modelId}/versions`,
        versionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error creating new version for model ${modelId}:`, error);
      throw error;
    }
  }
};