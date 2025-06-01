import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { verifyToken, roleGuard, AuthReq } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// Esta es la ruta pública (con token) para obtener tu perfil
router.get(
  "/me",
  verifyToken,
  async (req: AuthReq, res) => {
    const { id } = req.user!;
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return res.json(u);
  }
);

// Protege todas las rutas de /users: solo owner/admin
router.use(verifyToken, roleGuard(Role.owner, Role.admin));

router.get(
  "/",
  async (_req: AuthReq, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      res.json(users);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  "/:id/role",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { role } = req.body as { role: string };
    if (!["owner", "admin", "viewer"].includes(role)) {
      res.status(400).json({ message: "Rol inválido" });
      return;
    }
    try {
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { role: role as Role },
      });
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      await prisma.user.delete({ where: { id: Number(id) } });
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  }
);

export default router;

