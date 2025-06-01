// aura-backend/src/middleware/deviceAuth.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function verifyDeviceCode(req: Request, res: Response, next: NextFunction) {
  // Permitimos que 'code' vaya en header 'x-device-code' o en el body JSON { code: ... }
  const codeFromHeader = typeof req.headers["x-device-code"] === "string"
    ? (req.headers["x-device-code"] as string)
    : null;
  const codeFromBody = (req.body && req.body.code) ? req.body.code : null;
  const code = codeFromHeader || codeFromBody;

  if (!code) {
    return res.status(401).json({ message: "Código de dispositivo requerido" });
  }

  const device = await prisma.device.findUnique({ where: { code } });
  if (!device) {
    return res.status(404).json({ message: "Código de dispositivo no reconocido" });
  }

  if (!device.registered) {
    return res.status(401).json({ message: "Dispositivo aún no registrado" });
  }

  // Adjuntamos el deviceId al request para uso en la ruta
  (req as any).deviceId = device.id;
  next();
}
