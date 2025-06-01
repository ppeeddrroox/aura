import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const link =
    "block py-2 px-4 rounded hover:bg-gray-200 transition-colors text-sm";
  return (
    <aside className="w-56 bg-white shadow h-full p-4">
      <NavLink to="/" end className={link}>
        Resumen
      </NavLink>
      <NavLink to="/rooms" className={link}>
        Salas
      </NavLink>
      <NavLink to="/devices" className={link}>
        Dispositivos
      </NavLink>
    </aside>
  );
}
