interface ModelResponse {
  id: string;
  name: string;
  description: string | null;
  version: {
    versionNumber: number;
    filecoinCid: string;
    metadatacid: string;
    id: string;
  };
  createdAt: string;
}

const API_BASE_URL = "http://localhost:3002";

export const modelService = {
  /**
   * Upload a new model
   */
  async uploadModel(modelData: FormData): Promise<ModelResponse> {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }

    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: modelData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload model");
    }

    return response.json();
  },

  /**
   * Create a new version of an existing model
   */
  async createModelVersion(
    modelId: string,
    versionData: FormData
  ): Promise<any> {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Authentication required. Please log in");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/models/${modelId}/versions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: versionData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create model version");
    }

    return response.json();
  },
};
