// src/pages/NotFound.tsx

import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-4">Página no encontrada</p>
      <Link to="/" className="py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Volver al inicio
      </Link>
    </div>
  );
}

