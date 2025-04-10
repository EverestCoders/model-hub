import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

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
  }
};