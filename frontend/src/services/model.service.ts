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

interface ModelVersionsResponse {
  versions: ModelVersion[];
}

export const modelService = {
  async getModels(filters: ModelFilter = {}) {
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
      
      const response = await axios.get(`${API_BASE_URL}/models?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  async getModelById(id: string) {
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

  async rateModel(modelId: string, rating: number, review?: string) {
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
}