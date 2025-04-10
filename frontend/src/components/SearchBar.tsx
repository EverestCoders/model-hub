import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategorySelect: (category: string) => void;
}

export default function SearchBar({ onSearch, onCategorySelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Language"]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
    onCategorySelect(category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border-2 border-gray-600 flex flex-col sm:flex-row overflow-hidden mb-6 lg:h-15">
      <div className="flex flex-wrap gap-2 p-3 flex-1">
        {selectedCategories.map((category) => (
          <Button
            key={category}
            variant="secondary"
            className={`rounded-full text-xs px-4 py-1 h-auto border border-gray-600 ${
              category === "Diffusion" ? "bg-green-100" : "bg-purple-100"
            }`}
            onClick={() => handleCategoryClick(category)}
            type="button"
          >
            {category}
          </Button>
        ))}
        <Button variant="secondary" className="text-xs px-2 py-1 h-auto border border-gray-600" type="button">
          + Add more categories
        </Button>
      </div>
      <div className="flex items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-600 gap-3">
        <Input
          type="text"
          placeholder="Search models..."
          className="border border-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 pr-20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button className="rounded-lg bg-gray-800 text-white px-6" type="submit">
          Search
        </Button>
      </div>
    </form>
  );
}