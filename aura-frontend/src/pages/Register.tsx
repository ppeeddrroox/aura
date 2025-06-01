// src/pages/Register.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const setToken = useAuth((state) => state.setToken);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Si ya hay token, redirige al dashboard
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Cada vez que cambian los campos, limpiamos el error
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [name, email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      // Enviamos POST /auth/register
      const { token } = await request<{ token: string }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });

      // Guardamos el token
      setToken(token);

      // Redirigimos al dashboard
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-8 w-80 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-primary">
          Crear cuenta
        </h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          name="name"
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border rounded w-full p-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded w-full p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded w-full p-2"
        />
        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Registrarme
        </button>
        <p className="text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}

