import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const setToken = useAuth((state) => state.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [logoMoved, setLogoMoved] = useState(false);

  // Si ya hay token → redirigir
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Animación al iniciar: primero logo, luego formulario
  useEffect(() => {
    const logoTimer = setTimeout(() => setLogoMoved(true), 1200);
    const formTimer = setTimeout(() => setShowForm(true), 1800);
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(formTimer);
    };
  }, []);

  // Limpia error al editar inputs
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const { token } = await request<{ token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      setToken(token);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    }
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center relative overflow-hidden">
      {/* LOGO central que se anima */}
      <img
        src="/logo-aura.png"
        alt="AURA logo"
        className={`
          absolute w-72 transition-all duration-1000 ease-in-out
          ${logoMoved ? "top-8 scale-50" : "top-1/2 -translate-y-1/2 scale-100"}
          left-1/2 -translate-x-1/2 z-10
        `}
      />

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className={`
          transition-all duration-700 ease-in-out delay-300
          ${showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md mt-60 space-y-5 z-20
        `}
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Iniciar sesión
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm text-center border border-red-300">
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
        >
          Entrar
        </button>

        <p className="text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}

