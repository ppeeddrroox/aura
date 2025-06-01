import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";

type Detection = {
  expressions: Record<string, number>;
};

// Umbrales de emoción dominante
const EMOTION_THRESHOLDS: Record<string, { state: string; minPct: number }> = {
  happy: { state: "Confort", minPct: 50 },
  neutral: { state: "Calma", minPct: 50 },
  sad: { state: "Incomodidad", minPct: 40 },
  angry: { state: "Estrés", minPct: 30 },
  surprised: { state: "Expectativa", minPct: 30 },
  disgust: { state: "Distracción", minPct: 25 },
  fear: { state: "Energía", minPct: 25 },
  contempt: { state: "Conflicto", minPct: 20 },
};

// Colores por estado
const STATE_COLOR: Record<string, string> = {
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

export default function Monitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionsRef = useRef<Detection[]>([]); // ← ref para mantener siempre la última
  const [code, setCode] = useState("");
  const [started, setStarted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string>();
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (msg: string) =>
    setLogs((arr) => [...arr, `${new Date().toLocaleTimeString()} ${msg}`]);

  // 1) Cargar modelos al arrancar
  useEffect(() => {
    if (!started) return;
    addLog("Cargando modelos…");
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ])
      .then(() => {
        addLog("Modelos cargados OK");
        setModelsLoaded(true);
        startVideo();
      })
      .catch((e) => {
        console.error(e);
        addLog(`Error cargando modelos: ${e}`);
        setError("Error cargando modelos");
      });
  }, [started]);

  function startVideo() {
    addLog("Solicitando cámara…");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => addLog("Vídeo en reproducción"))
            .catch((e) => {
              addLog(`Error en play(): ${e}`);
              setError("No se pudo reproducir vídeo");
            });
        }
      })
      .catch((e) => {
        addLog(`Permiso denegado o error cámara: ${e}`);
        setError("Permiso de cámara denegado");
      });
  }

  // 2) Loop de detección cada 200ms
  useEffect(() => {
    if (!started || !modelsLoaded || !videoRef.current) return;
    addLog("Iniciando detección continua");
    const detectInterval = setInterval(async () => {
      try {
        const results = await faceapi
          .detectAllFaces(
            videoRef.current!,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();
        setDetections(results);
        detectionsRef.current = results; // ← mantenemos el ref sincronizado
        addLog(`Detectadas ${results.length} personas`);
      } catch (e) {
        console.error(e);
        addLog(`Error detectando caras: ${e}`);
      }
    }, 200);
    return () => {
      clearInterval(detectInterval);
      addLog("Detención del bucle de detección");
      const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, [started, modelsLoaded]);

  // 3) Cada 10s calcular estado y enviar
  useEffect(() => {
    if (!started) return;
    addLog("[sendLoop] iniciado");
    const sendInterval = setInterval(() => {
      const dets = detectionsRef.current; // ← leemos siempre la última
      addLog(`[sendLoop] usando detecciones: ${dets.length}`);
      const { roomState, measurement } = computeRoomState(dets);
      addLog(`[sendLoop] roomState=${roomState}, measurement=${measurement}`);
      sendData(roomState, measurement);
    }, 10_000);
    return () => {
      clearInterval(sendInterval);
      addLog("[sendLoop] detenido");
    };
  }, [started]);

  // 4) Función para calcular estado de ambiente + medida
  function computeRoomState(dets: Detection[]): { roomState: string; measurement: number } {
    const N = dets.length;
    if (N === 0) return { roomState: "Calma", measurement: 0 };

    // Si solo hay una persona, forzamos su emoción dominante sin mirar umbrales ocupación
    if (N === 1) {
      const [expr] = Object.entries(dets[0].expressions)
        .sort((a, b) => b[1] - a[1])[0];
      const rule = EMOTION_THRESHOLDS[expr];
      const state = rule?.state ?? "Calma";
      return { roomState: state, measurement: 1 };
    }

    // Contar emociones dominantes
    const counts: Record<string, number> = {};
    dets.forEach((d) => {
      const [expr] = Object.entries(d.expressions).sort((a, b) => b[1] - a[1])[0];
      counts[expr] = (counts[expr] || 0) + 1;
    });
    // El par [emoción, veces] más frecuente
    const [dominant, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const pct = (count / N) * 100;        // porcentaje
    const frac = count / N;               // medición 0–1

    // 3.a) muchos sin claro dominante (grupo grande, emoción dispersa)
    if (N >= 10 && pct < 30) {
      return { roomState: "Monotonía", measurement: frac };
    }

    // 3.b) emoción dominante supera umbral
    const emoRule = EMOTION_THRESHOLDS[dominant];
    if (emoRule && pct >= emoRule.minPct) {
      return { roomState: emoRule.state, measurement: frac };
    }

    // 3.c) fallback por ocupación
    if (N <= 2)   return { roomState: "Calma",     measurement: frac };
    if (N <= 5)   return { roomState: "Confort",   measurement: frac };
    if (N <= 9)   return { roomState: "Energía",   measurement: frac };
                  return { roomState: "Monotonía", measurement: frac };
  }

  // 5) Enviar datos al backend
  async function sendData(roomState: string, measurement: number) {
    addLog(`[sendData] payload → ${JSON.stringify({ code, measurement, roomState })}`);
    try {
      const res = await fetch("/api/devices/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, measurement, roomState }),
      });
      if (!res.ok) throw new Error(res.statusText);
      addLog(`Enviado → ${JSON.stringify({ code, measurement, roomState })}`);
    } catch (e: any) {
      addLog(`Error enviando datos: ${e.message || e}`);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setStarted(true);
  }

  // JSX
  if (!started) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        {!!error && <p className="text-red-500">{error}</p>}
        <h2 className="text-2xl font-bold mb-4">Monitor AURA-CAM</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            className="w-full p-2 border rounded"
            placeholder="Código (p.ej. AURA-ABC001)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-primary text-white p-2 rounded"
          >
            Empezar
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-sm text-gray-500 underline"
          >
            ← Volver
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!!error && (
        <div className="absolute top-0 left-0 p-2 bg-red-600 text-white">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-auto object-cover"
      />
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
        Personas: {detections.length}
        <ul className="mt-1 text-sm">
          {detections.map((d, i) => {
            const [expr] = Object.entries(d.expressions).sort(
              (a, b) => b[1] - a[1]
            )[0];
            return (
              <li key={i}>
                #{i + 1}: {expr}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="absolute bottom-0 left-0 w-full max-h-40 overflow-auto bg-black bg-opacity-75 text-xs text-green-400 p-2">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}