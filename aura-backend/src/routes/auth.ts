import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "El nombre, el email y la contraseña son requeridos" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Este email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign(
      { sub: user.id, role: "viewer" },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    return res.status(201).json({ token });
  } catch (err: any) {
    console.error("Error en /auth/register:", err);
    return res.status(500).json({ message: "Error interno al registrar el usuario" });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "El email y la contraseña son requeridos" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    return res.json({ token });
  } catch (err: any) {
    console.error("Error en /auth/login:", err);
    return res.status(500).json({ message: "Error interno al iniciar sesión" });
  }
});

export default router;