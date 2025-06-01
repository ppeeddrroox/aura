import React, { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";
import { useNavigate } from "react-router-dom";

interface Device {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  location: string | null;
  registered: boolean;
  createdAt: string;
}

export default function MyDevices() {
  const token = useAuth((s) => s.token);
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return; // detenemos el efecto aquí
    }
    fetchDevices();
  }, [token, navigate]);

  async function fetchDevices() {
    try {
      const { devices } = await request<{ devices: Device[] }>(
        "/api/devices/my-devices",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // envío explícito del token
          },
        }
      );
      setDevices(devices);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mis Aura-CAMs</h1>
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      {devices.length === 0 ? (
        <p className="text-gray-600">No tienes Aura-CAMs vinculados todavía.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Código</th>
              <th className="border px-4 py-2">Alias</th>
              <th className="border px-4 py-2">Descripción</th>
              <th className="border px-4 py-2">Ubicación</th>
              <th className="border px-4 py-2">Creado</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="text-center">
                <td className="border px-4 py-2">{d.code}</td>
                <td className="border px-4 py-2">{d.name || "-"}</td>
                <td className="border px-4 py-2">{d.description || "-"}</td>
                <td className="border px-4 py-2">{d.location || "-"}</td>
                <td className="border px-4 py-2">
                  {new Date(d.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
