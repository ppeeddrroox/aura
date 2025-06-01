// src/routes/ProtectedRoute.tsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth";
import Navbar from "../components/Navbar";

export default function ProtectedRoute() {
  const token = useAuth((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

