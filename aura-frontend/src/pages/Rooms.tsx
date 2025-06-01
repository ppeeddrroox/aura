import { Link } from "react-router-dom";

export default function Rooms() {
  // mock
  const rooms = [{ id: "1", name: "Aula 101", sensors: 3 }];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Salas</h2>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="p-3">Nombre</th>
            <th className="p-3">Sensores</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.name}</td>
              <td className="p-3">{r.sensors}</td>
              <td className="p-3">
                <Link to={`/rooms/${r.id}`} className="btn-primary py-1 px-3 text-sm">
                  Ver mapa
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
