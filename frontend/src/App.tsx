import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Models from "./components/Models";
import "./App.css";
import UploadModelForm from "./components/UpladModel";
import ModelDetails from "./components/ModelDetails";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = !!localStorage.getItem("auth_token");

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
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
  );
}

export default App;
