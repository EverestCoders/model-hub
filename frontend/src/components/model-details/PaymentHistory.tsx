import React, { useState, useEffect } from "react";
import { useBlockchain } from "../../contexts/BlockChainContext";
import { ExternalLink, Loader2, DollarSign, RefreshCw, WalletIcon, AlertCircle } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";

interface PaymentHistoryProps {
  modelId: number | null;
  ownerAddress?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  modelId,
  ownerAddress,
}) => {
  const { getModelPaymentsCount, getModelPaymentAt } = useBlockchain();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEarned, setTotalEarned] = useState<string>("0");

  // Load payment history
  const loadPayments = async () => {
    if (!modelId) return;

    setLoading(true);
    setError(null);

    try {
      const count = await getModelPaymentsCount(modelId);
      const paymentDetails = [];
      let totalAmount = ethers.parseEther("0");

      for (let i = 0; i < count; i++) {
        const payment = await getModelPaymentAt(modelId, i);

        // Add to total (subtracting platform fee)
        const netAmount = payment[2] - payment[3]; // amount - platformFee
        totalAmount = totalAmount + BigInt(netAmount);

        paymentDetails.push({
          payer: payment[0],
          payee: payment[1],
          amount: payment[2],
          platformFee: payment[3],
          timestamp: payment[4],
          modelCid: payment[5],
        });
      }

      setPayments(paymentDetails);
      setTotalEarned(ethers.formatEther(totalAmount));
    } catch (err) {
      console.error("Error loading payment history:", err);
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [modelId]);

  // Check if current user is the owner
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isOwner =
    user &&
    ownerAddress &&
    user.walletAddress?.toLowerCase() === ownerAddress.toLowerCase();

  // to not show non-owners unless there are transactions
  if (!isOwner && (payments.length === 0 || loading)) {
    return null;
  }

  return (
    <Card className="mt-6 overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-gray-800">
            Transaction History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
            className="bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {isOwner && payments.length > 0 && (
          <div className="mt-3 bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-md border border-green-100 flex items-center shadow-sm">
            <div className="bg-green-500 text-white p-2 rounded-full mr-3">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-green-800 text-base">
                {totalEarned} FIL Earned
              </p>
              <p className="text-xs text-green-700">
                From {payments.length} transaction
                {payments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-5 w-5 mr-2 text-blue-500" />
            <span className="text-gray-600">
              Loading transaction history...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 text-center text-sm border-t border-red-100">
            <AlertCircle className="h-5 w-5 mx-auto mb-2" />
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-gray-500 p-8 text-center border-t">
            <p className="text-sm mb-2">No transactions recorded yet.</p>
            <p className="text-xs">
              Transactions will appear here after purchases are made.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="recent" className="w-full">
            <div className="border-b">
              <TabsList className="w-full justify-start bg-transparent pl-4 pt-2">
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  Recent Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  All History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recent" className="mt-0">
              <ScrollArea className="h-[300px] p-4">
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment, idx) => (
                    <TransactionCard payment={payment} key={idx} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[300px] p-4">
                <div className="space-y-3">
                  {payments.map((payment, idx) => (
                    <TransactionCard payment={payment} key={idx} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

const TransactionCard = ({ payment }: any) => {
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200">
      <div className="flex">
        <div className="bg-gradient-to-b from-blue-50 to-indigo-50 p-3 border-r border-gray-100">
          <div className="bg-white rounded-full p-2 shadow-sm">
            <WalletIcon className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="flex-1 p-3">
          <div className="flex justify-between mb-1">
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 bg-blue-50 font-mono"
            >
              {formatAddress(payment.payer)}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatDate(payment.timestamp)}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-1">
              {ethers.formatEther(payment.amount.toString())} FIL
            </Badge>
            <Badge variant="outline" className="text-gray-600 bg-gray-50">
              Fee: {ethers.formatEther(payment.platformFee.toString())} FIL
            </Badge>
          </div>
          <a
            href={`https://calibration.filfox.info/en/message/${
              payment.txHash || ""
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center mt-2"
          >
            View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
    </Card>
  );
};
