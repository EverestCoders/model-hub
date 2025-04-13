import React from 'react';

interface ModelRatingsProps {
  ratings: Array<{
    rating: number;
    review: string | null;
    userId: string;
    username: string | null;
    createdAt: string;
  }>;
}

export const ModelRatings: React.FC<ModelRatingsProps> = ({ ratings }) => {
  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="font-medium mb-3">Ratings</h3>
      {ratings && ratings.length > 0 ? (
        <div className="space-y-3">
          {ratings.slice(0, 3).map((rating, index) => (
            <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {rating.username || 'Anonymous'}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
              </div>
              {rating.review && (
                <p className="text-xs text-gray-600 mt-1">{rating.review}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No ratings yet.</p>
      )}
    </div>
  );
};