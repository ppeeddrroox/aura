import { MapContainer, ImageOverlay, Marker, Popup } from "react-leaflet";
import { CRS, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RoomMap() {
  const bounds = new LatLngBounds([0, 0], [600, 1000]); // 1000x600px plano

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-gray-200 flex items-center px-4">
        <button onClick={() => history.back()} className="text-primary hover:underline">
          ← Volver
        </button>
        <h2 className="ml-4 font-semibold">Plano de la sala</h2>
      </header>
      <MapContainer
        crs={CRS.Simple}
        bounds={bounds}
        style={{ flex: 1 }}
        minZoom={-1}
      >
        <ImageOverlay url="/room.png" bounds={bounds} />
        <Marker position={[300, 500]}>
          <Popup>Sensor CO₂</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

