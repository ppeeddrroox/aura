// src/pages/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { request } from "../lib/api";
import logo from "../assets/logo-aura.png";

interface Device {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  location: string | null;
  registered: boolean;
  createdAt: string;
  lastMeasurement?: {
    emotion: string;
    value: number;
    timestamp: string;
  };
}

interface MeasurementRecord {
  id: number;
  deviceId: string;
  value: number;
  roomState: string;
  timestamp: string;
}

export default function Dashboard() {
  const token = useAuth((s) => s.token);
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [userId, setUserId] = useState<number>();
  const [socket, setSocket] = useState<Socket>();
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [alertEmotions, setAlertEmotions] = useState<Record<string, string>>({});

  // Mapeo de emociones a colores
  const EMOTION_COLORS: Record<string, string> = {
    Confort: "#4CAF50",
    Energía: "#FF9800",
    Estrés: "#E53935",
    Incomodidad: "#795548",
    Calma: "#03A9F4",
    Distracción: "#FFC107",
    Colaboración: "#2196F3",
    Monotonía: "#9E9E9E",
    Conflicto: "#B71C1C",
    Expectativa: "#FFEB3B",
  };

  // 1) cargar userId y dispositivos
  useEffect(() => {
    if (!token) return navigate("/login", { replace: true });
    request<{ id: number }>("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ id }) => setUserId(id))
      .catch(() => setError("Error al obtener usuario"));
    fetchDevices();
  }, [token]);

  // 2) abrir socket y actualizar estado en caliente
  useEffect(() => {
    if (!userId) return;
    const sock = io("http://localhost:4000", {
      query: { userId: String(userId) },
    });
    sock.on("new_measurement", (rec: MeasurementRecord) => {
      // actualiza última medición
      setDevices((prev) =>
        prev.map((d) =>
          d.id === rec.deviceId
            ? {
                ...d,
                lastMeasurement: {
                  emotion: rec.roomState,
                  value: rec.value,
                  timestamp: rec.timestamp,
                },
              }
            : d
        )
      );
      // lanza la animación y overlay durante 3s
      setAlertEmotions((prev) => ({ ...prev, [rec.deviceId]: rec.roomState }));
      setAlerts((prev) => [...prev, rec.deviceId]);
      setTimeout(() => {
        setAlerts((prev) => prev.filter((id) => id !== rec.deviceId));
        setAlertEmotions((prev) => {
          const rest = { ...prev };
          delete rest[rec.deviceId];
          return rest;
        });
      }, 3000);
    });
    setSocket(sock);
    return () => {
      sock.disconnect();
    };
  }, [userId]);

  async function fetchDevices() {
    try {
      const { devices } = await request<{ devices: Device[] }>(
        "/api/devices/my-devices",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDevices(devices);
    } catch {
      setError("Error al cargar dispositivos");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Encabezado */}
      <header className="flex items-center mb-12">
        <img src={logo} alt="AURA" className="h-12 mr-4" />
        <h1 className="text-4xl font-extrabold">Dashboard AURA</h1>
        <Link
          to="/devices/add"
          className="ml-auto bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
        >
          ➕ Añadir nuevo Aura
        </Link>
      </header>

      {/* Error genérico */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}

      {/* Tarjetas de dispositivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((d) => {
          const isAlert = alerts.includes(d.id);
          const overlayEmotion = alertEmotions[d.id];
          const borderColor = d.lastMeasurement
            ? EMOTION_COLORS[d.lastMeasurement.emotion]
            : undefined;

          return (
            <div
              key={d.id}
              className={`relative bg-white shadow rounded overflow-hidden transform transition-transform duration-500 ${
                isAlert ? "scale-105" : ""
              }`}
              style={borderColor ? { borderLeft: `6px solid ${borderColor}` } : undefined}
            >
              {overlayEmotion && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                  <span
                    className="text-5xl font-extrabold"
                    style={{ color: EMOTION_COLORS[overlayEmotion] }}
                  >
                    {overlayEmotion}
                  </span>
                </div>
              )}
              {/* Cabecera plegable */}
              <button
                onClick={() =>
                  setExpandedId((prev) => (prev === d.id ? null : d.id))
                }
                className="w-full text-left p-4 flex justify-between items-center"
              >
                <div>
                  <h2 className="text-xl font-semibold">{d.code}</h2>
                  <p className="text-gray-600">{d.name || "Sin alias"}</p>
                </div>
                <span className="text-gray-400">
                  {expandedId === d.id ? "▲" : "▼"}
                </span>
              </button>

              {/* Detalles expandibles */}
              {expandedId === d.id && (
                <div className="p-4 bg-gray-50 space-y-2">
                  <p>
                    <strong>Descripción:</strong> {d.description || "-"}
                  </p>
                  <p>
                    <strong>Ubicación:</strong> {d.location || "-"}
                  </p>
                  <p>
                    <strong>Creado:</strong>{" "}
                    {new Date(d.createdAt).toLocaleString()}
                  </p>

                  {d.lastMeasurement ? (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <strong>Última medición:</strong>
                      <p className="text-indigo-600">
                        {d.lastMeasurement.emotion} – {d.lastMeasurement.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(
                          d.lastMeasurement.timestamp
                        ).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Sin mediciones aún</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {devices.length === 0 && !error && (
          <p className="col-span-full text-center text-gray-600">
            No tienes Aura-CAMs vinculados todavía.
          </p>
        )}
      </div>
    </div>
  );
}

