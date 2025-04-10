import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export interface FilterBarProps {
  onFilterChange: (filterName: string, value: string) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [additionalCategories] = useState<string[]>(["language", "diffusion", "audio"]);

  const filters = [
    { name: "Date posted", options: ["Newest first", "Oldest first"] },
    { name: "License", options: ["MIT", "Apache 2.0", "CreativeML Open RAIL-M", "Custom"] },
    { name: "Category", options: ["language", "diffusion", "audio", "video", "3d"] },
    { name: "Commercial use", options: ["Allowed", "Not allowed"] },
  ];

  return (
    <div className="mt-6">
      <div className="text-sm text-gray-600 mb-2">Filter by:</div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <DropdownMenu key={filter.name}>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 text-sm border border-gray-600 rounded px-3 py-1.5" variant={"secondary"}>
                {filter.name}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filter.options.map((option) => (
                <DropdownMenuItem key={option} onClick={() => onFilterChange(filter.name, option)}>
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {additionalCategories.map((category, index) => (
          <button
            key={category}
            className={`text-sm rounded-lg px-3 py-1 border-2 border-gray-600 ${
              index === 0 ? "bg-yellow-100" : index === 1 ? "bg-blue-100" : "bg-green-100"
            }`}
            onClick={() => onFilterChange("Category", category)}
          >
            {category}
          </button>
        ))}
        <span className="text-sm text-gray-600 py-1">Add more categories</span>
      </div>
    </div>
  );
}