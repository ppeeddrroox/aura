import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Edit2, LogOut } from "lucide-react";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";

export default function Account() {
  const token = useAuth((s) => s.token)!;
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carga perfil
  useEffect(() => {
    if (!token) return navigate("/login", { replace: true });
    request<{ id: number; name: string; email: string }>("/api/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setUser({ name: data.name, email: data.email });
        setForm({ name: data.name, email: data.email, password: "" });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [token, navigate]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    try {
      const updated = await request<{ name: string; email: string }>("/api/users/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: { ...form, password: form.password || undefined },
      });
      setUser(updated);
      setForm({ ...form, password: "" });
      setSuccess("Perfil actualizado");
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleLogout() {
    setToken(null);
    navigate("/login", { replace: true });
  }

  if (!user) return <p>Cargando perfil…</p>;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <div className="flex items-center mb-6 space-x-4">
        <User className="h-10 w-10 text-gray-500" />
        <h2 className="text-2xl font-semibold">Mi Cuenta</h2>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}

      {!editing ? (
        <>
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center space-x-1"
            >
              <Edit2 className="h-4 w-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Nueva contraseña</label>
            <input
              type="password"
              placeholder="(dejar vacío para no cambiar)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-base"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSave} className="btn-success">
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-warning"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}