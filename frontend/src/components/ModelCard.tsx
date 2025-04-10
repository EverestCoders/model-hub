import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface ModelCardProps {
  id: string;
  title: string;
  creator: string;
  description: string;
  tags: string[];
  category?: string;
}

export default function ModelCard({ id, title, creator, description, tags, category }: ModelCardProps) {
  // Get appropriate icon based on category
  const getCategoryIcon = (category: string | undefined): string => {
    switch (category) {
      case 'language': return '🧠';
      case 'diffusion': return '🎨';
      case 'audio': return '🔊';
      case 'video': return '🎬';
      case '3d': return '🧊';
      default: return '📦';
    }
  };

  return (
    <Card className="mb-4 border-3 border-gray-600 rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xl">
            {getCategoryIcon(category)}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{creator}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600" asChild>
          <Link to={`/models/${id}`} className="flex items-center gap-1">
            View <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-700">{description}</p>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        {category && (
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            <span className="w-3.5 h-3.5 inline-flex items-center justify-center">🏷️</span>
            {category}
          </div>
        )}
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {tag}
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}