import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Models from "./components/Models";
import "./App.css";
import UploadModelForm from "./components/UpladModel";
import ModelDetails from "./components/ModelDetails";
import { TransactionQueue } from "./components/TransactionQueue";
import { useBlockchain, BlockchainProvider } from "./contexts/BlockChainContext";
import { Toaster } from "./components/ui/sonner";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = !!localStorage.getItem("auth_token");

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const BlockchainMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactions } = useBlockchain();
  
  return (
    <>
      {children}
      <TransactionQueue transactions={transactions} />
    </>
  );
};

function App() {
  return (
    <BlockchainProvider>
      <BlockchainMonitor>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models" element={<Models />} />
        <Route
          path="/models/:id"
          element={<ModelDetails />}
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadModelForm />
            </ProtectedRoute>
          }
        />
        </Routes>
        <Toaster position="bottom-right" />
      </BlockchainMonitor>
      </BlockchainProvider>
  );
}

export default App;
