// src/pages/Users.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../lib/api";
import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, AuthReq } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// GET /api/users/me  → devuelve perfil actual
router.get("/me", verifyToken, async (req: AuthReq, res: Response) => {
  const { id, role } = req.user!;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return res.json(user);
});

// PUT /api/users/me  → actualiza nombre, email y/o password
router.put("/me", verifyToken, async (req: AuthReq, res: Response) => {
  const userId = req.user!.id;
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return res.json(updated);
});

export default router;

export default function Users() {
  const qc = useQueryClient();
  const { data: users } = useQuery(["users"], () => request("/users"));

  const mutateRole = useMutation(
    (vars: { id: number; role: string }) =>
      request(`/users/${vars.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: vars.role }),
      }),
    { onSuccess: () => qc.invalidateQueries(["users"]) }
  );

  if (!users) return <p>Cargando…</p>;

  return (
    <div>
      <h2 className="title-xl mb-4">Gestión de usuarios</h2>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-neutral text-left">
            <th className="p-3">Nombre</th>
            <th className="p-3">Email</th>
            <th className="p-3">Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="border-t">
              <td className="p-3">{u.name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <select
                  defaultValue={u.role}
                  onChange={(e) => mutateRole.mutate({ id: u.id, role: e.target.value })}
                  className="border rounded p-1"
                >
                  <option value="viewer">viewer</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

