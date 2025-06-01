// aura-backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

//
// Definimos una extensión de Request que pueda llevar nuestro payload decodificado.
// Role lo tipamos como string, porque en Prisma lo tenemos definido así en schema.prisma.
//
export interface AuthReq extends Request {
  user?: { id: number; role: string };
}

/**
 * Middleware: verifyToken
 *
 * 1) Busca header "Authorization: Bearer <token>".
 * 2) Verifica el JWT con la clave secreta.
 * 3) Comprueba que el payload tenga sub (número) y role (cadena).
 * 4) Asigna req.user = { id: sub, role }.
 * 5) Si algo falla, devuelve 401 o 403.
 */
export function verifyToken(
  req: AuthReq,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Token requerido" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ message: "Formato de token inválido" });
    return;
  }

  const token = parts[1];
  if (!token) {
    res.status(401).json({ message: "Token inválido" });
    return;
  }

  try {
    // jwt.verify devuelve string o JwtPayload
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") {
      // No esperamos un string, debe ser un objeto con sub y role
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    // decoded es JwtPayload
    const payload = decoded as JwtPayload;

    // payload.sub proviene de cuando generamos el token: jwt.sign({ sub: user.id, role: user.role }, ...)
    const subRaw = payload.sub;
    const roleRaw = (payload as any).role; // role lo añadimos nosotros al firmar el token

    // Validamos tipos
    if (typeof subRaw !== "number" || typeof roleRaw !== "string") {
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    // Guardamos en req.user
    req.user = { id: subRaw, role: roleRaw };
    next();
  } catch {
    res.status(401).json({ message: "Token inválido" });
    return;
  }
}

/**
 * roleGuard(...allowedRoles)
 *
 * Middleware que comprueba que req.user.role esté en la lista de roles permitidos.
 * Debe usarse después de verifyToken.
 *
 * Ejemplo:
 *   router.get("/admin-only", verifyToken, roleGuard("admin"), (req, res) => { ... });
 */
export const roleGuard =
  (...allowedRoles: string[]) =>
  (req: AuthReq, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Token requerido" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Sin permiso" });
      return;
    }
    next();
  };

