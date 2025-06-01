import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyDeviceCode } from "../middleware/deviceAuth.js";

const prisma = new PrismaClient();
const router = Router();

router.post("/", verifyDeviceCode, async (req: Request, res: Response) => {
  // <-- remove any lines beginning with '-' or '+'
  const deviceId = (req as any).deviceId as string;  // correct, no diff markers

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
});

export default router;
