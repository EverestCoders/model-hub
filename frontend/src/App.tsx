import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Models from "./components/Models";
import Home from "./components/Home";
import "./App.css"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('auth_token');
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/models" 
        element={
          <ProtectedRoute>
            <Models />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App
