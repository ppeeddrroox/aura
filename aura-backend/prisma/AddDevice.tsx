import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";

export default function AddDevice() {
  const token = useAuth((s) => s.token);
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    fetchDevices();
  }, [token, navigate]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [code, name, description, location]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("El código de dispositivo es obligatorio");
      return;
    }
    try {
      const dev = await request("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: {
          code: code.trim().toUpperCase(),
          name: name || undefined,
          description: description || undefined,
          location: location || undefined,
        },
      });
      setSuccess(`Dispositivo "${dev.code}" reclamado con éxito`);
      setCode("");
      setName("");
      setDescription("");
      setLocation("");
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        setToken(null);
        navigate("/login", { replace: true });
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Añadir nuevo AURA</h1>
        <Link to="/" className="text-blue-600">
          ← Volver
        </Link>
      </header>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
        <div>
          <label className="block">Código</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="AURA-ABC001"
            required
          />
        </div>
        <div>
          <label className="block">Alias (opcional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block">Ubicación</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Reclamar dispositivo
        </button>
      </form>
    </div>
  );
}