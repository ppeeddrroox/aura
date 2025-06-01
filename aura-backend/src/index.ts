// aura-backend/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";           // opcional, para ver logs de peticiones
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.js";
import usersRoutes from "./routes/users.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Ajustamos CORS para cubrir OPTIONS y todos los métodos
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.147:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// 1) aplicación general de CORS
app.use(cors(corsOptions));

// 2) responder a preflight de todas las rutas
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));                // ver cada petición en consola

// Creamos el servidor HTTP y Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

io.on("connection", (socket: Socket) => {
  // El cliente debe pasar su userId en handshake.query
  const userId = socket.handshake.query.userId as string;
  if (userId) socket.join(`user-${userId}`);
});

// Nuevo endpoint definitivo
app.post("/api/devices/data", async (req, res) => {
  // deviceId es en realidad el código público (p.ej. "AURA-ABC002")
  const { code, measurement, roomState } = req.body;
  try {
    const device = await prisma.device.findUnique({
      where: { code }            // AURA-ABC002 se busca en code
    });
    // ahora comprobamos también que ownerId exista
    if (!device || !device.ownerId) {
      return res.json({ status: "no_registrado" });
    }
    // Guardamos la medición usando el id interno
    const record = await prisma.measurement.create({
      data: {
        deviceId: device.id,
        value: measurement,
        roomState,
        timestamp: new Date()
      }
    });
    // Emitimos al cliente conectado
    io.to(`user-${device.ownerId}`).emit("new_measurement", record);
    return res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error" });
  }
});

// Rutas de autenticación
app.use("/auth", authRoutes);

// Rutas de dispositivo (claim, list)
app.use("/api/devices", deviceRoutes);

// Rutas de usuarios
app.use("/api/users", usersRoutes);

// Health check
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
// Cambia a 0.0.0.0
server.listen({ port, host: "0.0.0.0" }, () =>
  console.log(`Server + Socket.IO listening on 0.0.0.0:${port}`)
);

