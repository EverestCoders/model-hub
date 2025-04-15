import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Shield, DollarSign, Users, Calendar } from 'lucide-react';

interface BlockchainStatsProps {
  modelId: number | null;
  details: any | null;
  paymentsCount: number;
  totalEarned: string;
}

export const BlockchainStats: React.FC<BlockchainStatsProps> = ({
  modelId,
  details,
  paymentsCount,
  totalEarned
}) => {
  if (!modelId || !details) return null;
  
  const statsItems = [
    {
      title: "Verification",
      value: "Verified",
      icon: <Shield className="h-4 w-4 text-white" />,
      color: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      title: "Access Fee",
      value: `${(details.accessFee)} FIL`,
      icon: <DollarSign className="h-4 w-4 text-white" />,
      color: "bg-gradient-to-r from-blue-500 to-indigo-500"
    },
    {
      title: "Purchases",
      value: paymentsCount.toString(),
      icon: <Users className="h-4 w-4 text-white" />,
      color: "bg-gradient-to-r from-purple-500 to-violet-500"
    },
    {
      title: "Registered",
      value: new Date(details.creationTime).toLocaleDateString(),
      icon: <Calendar className="h-4 w-4 text-white" />,
      color: "bg-gradient-to-r from-orange-500 to-amber-500"
    }
  ];

  return (
    <Card className="mt-6 overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-3">
        <CardTitle className="text-lg font-bold text-gray-800">Blockchain Stats</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-px bg-gray-200">
          {statsItems.map((item, index) => (
            <div key={index} className="bg-white p-4">
              <div className="flex items-center mb-2">
                <div className={`rounded-full p-2 mr-2 ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600">{item.title}</span>
              </div>
              <p className="text-gray-900 font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};