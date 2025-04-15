// frontend/src/components/Models.tsx
import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ModelCard from "./ModelCard";
import ModelChatbot from "./ModelChatbot"; // Import the new component
import { Button } from "./ui/button";
import { modelService, ModelFilter } from "../services/model.service";
import { useNavigate } from "react-router-dom";

const Models: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [filters, setFilters] = useState<ModelFilter>({
    page: 1,
    limit: 10,
    sort: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    fetchModels();
  }, [filters]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await modelService.getModels(filters);
      setModels(response.models);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error("Error fetching models:", err);
      setError("Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters({
      ...filters,
      query,
      page: 1, // Reset to first page when searching
    });
  };

  const handleCategorySelect = (category: string) => {
    setFilters({
      ...filters,
      category: category.toLowerCase(),
      page: 1, // Reset to first page when changing filters
    });
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...filters, page: 1 };

    if (filterName === "Category") {
      newFilters.category = value.toLowerCase();
    } else if (filterName === "License") {
      newFilters.license = value;
    } else if (filterName === "Date posted") {
      if (value === "Newest first") {
        newFilters.sort = "createdAt";
        newFilters.order = "desc";
      } else {
        newFilters.sort = "createdAt";
        newFilters.order = "asc";
      }
    }

    setFilters(newFilters);
  };
  
  const handleSelectModel = (modelId: string) => {
    navigate(`/models/${modelId}`);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="lg:w-1/2 flex">
        <div className="container mx-auto px-4 py-6">
          <Navbar />

          <main>
            <h1 className="text-3xl font-bold text-center mb-8">
              Explore Models
            </h1>

            <SearchBar
              onSearch={handleSearch}
              onCategorySelect={handleCategorySelect}
            />

            <FilterBar onFilterChange={handleFilterChange} />

            <div className="mt-6 mb-4">
              <p className="text-sm text-gray-600">
                We've found {pagination.total} model listings
              </p>
            </div>

            {loading ? (
              <div className="text-center py-10">Loading models...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : models.length === 0 ? (
              <div className="text-center py-10">
                No models found matching your criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    id={model.id}
                    title={model.name}
                    creator={model.creatorName || "Anonymous"}
                    description={
                      model.description || "No description provided."
                    }
                    tags={[
                      `License: ${model.licenseType}`,
                      `Downloads: ${model.downloadCount}`,
                    ]}
                    category={model.category}
                  />
                ))}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setFilters({ ...filters, page: pagination.page - 1 })
                  }
                >
                  Previous
                </Button>
                <span className="py-2 px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    setFilters({ ...filters, page: pagination.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Add the chatbot component */}
      <ModelChatbot onSelectModel={handleSelectModel} />
    </div>
  );
};

export default Models;