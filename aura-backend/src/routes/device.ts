// aura-backend/src/routes/device.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyDeviceCode } from "../middleware/deviceAuth.js";
import { verifyToken, AuthReq } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /devices/data
 * Body: { emotion: string, value: number, timestamp?: string }
 */
router.post(
  "/data",
  verifyDeviceCode,
  async (req: Request, res: Response) => {
    const deviceId = (req as any).deviceCode as string;
    const { emotion, value, timestamp } = req.body;

    if (!emotion || typeof value !== "number") {
      return res
        .status(400)
        .json({ message: "Campos 'emotion' y 'value' son necesarios" });
    }

    await prisma.dataPoint.create({
      data: {
        deviceId,
        emotion,
        value,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      },
    });

    return res.status(201).json({ success: true });
  }
);

/**
 * GET /devices/config
 * Devuelve la configuración actual del dispositivo
 */
router.get(
  "/config",
  verifyDeviceCode,
  async (req: Request, res: Response) => {
    const deviceId = (req as any).deviceCode as string;
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      return res.status(404).json({ message: "Dispositivo no registrado" });
    }

    // Ejemplo de configuración
    const config = {
      samplingInterval: device.registered ? 60 : 300,
      alias: device.name,
    };

    return res.json({ config });
  }
);

/**
 * POST /devices
 * Body: { code, name?, description?, location? }
 * Requiere Authorization: Bearer <token>
 */
router.post(
  "/",
  verifyToken,
  async (req: AuthReq, res: Response) => {
    const userId = req.user!.id;

    const { code, name, description, location } = req.body;
    if (!code) {
      return res.status(400).json({ message: "El código de dispositivo es obligatorio" });
    }

    const device = await prisma.device.findUnique({ where: { code } });
    if (!device) {
      return res.status(404).json({ message: "Código de dispositivo no válido" });
    }
    if (device.ownerId) {
      return res.status(400).json({ message: "Este dispositivo ya ha sido reclamado" });
    }

    const updated = await prisma.device.update({
      where: { code },
      data: {
        ownerId: userId,
        registered: true,
        name,
        description,
        location,
      },
    });

    return res.status(201).json(updated);
  }
);

/**
 * GET /devices/my-devices
 * Devuelve los dispositivos del usuario autenticado
 */
router.get(
  "/my-devices",
  verifyToken,
  async (req: AuthReq, res: Response) => {
    const userId = req.user!.id;
    const devices = await prisma.device.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        location: true,
        registered: true,
        createdAt: true,
      }
    });
    res.json({ devices });
  }
);

export default router;