import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyDevices from "./pages/MyDevices";
import AddDevice from "./pages/AddDevice";
import Account from "./pages/Account";
import Monitor from "./pages/Monitor";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas protegidas */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />             {/* GET "/" */}
        <Route path="devices" element={<MyDevices />} />    {/* GET "/devices" */}
        <Route path="devices/add" element={<AddDevice />} />{/* GET "/devices/add" */}
        <Route path="account" element={<Account />} />      {/* GET "/account" */}
      </Route>

      {/* Ruta para monitor */}
      <Route path="/monitor" element={<Monitor />} />

      {/* Cualquier otra ruta → /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}