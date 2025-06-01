import React from "react";
import { Link } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../store/auth";

export default function Navbar() {
  const setToken = useAuth((s) => s.setToken);

  return (
    <header className="h-16 bg-primary text-white flex items-center px-6 shadow">
      <img src="/logo.svg" alt="AURA" className="h-8 mr-4" />
      <span className="font-semibold mr-auto">AURA</span>

      {/* Enlace a “Mi Cuenta” */}
      <Link
        to="/account"
        className="flex items-center space-x-1 hover:underline mr-6"
      >
        <User className="h-5 w-5" />
        <span>Mi Cuenta</span>
      </Link>

      {/* Logout */}
      <button
        onClick={() => setToken(null)}
        className="flex items-center space-x-1 hover:underline"
      >
        <LogOut className="h-5 w-5" />
        <span>Salir</span>
      </button>
    </header>
  );
}
