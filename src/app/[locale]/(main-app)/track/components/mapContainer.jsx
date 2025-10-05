import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
const MapInner = () => {
  console.log("sadasd");

  return (
    <div className="flex w-full h-[calc(100vh-72px)]">
      <MapContainer
        zoom={6}
        scrollWheelZoom={true}
        center={[23.8859, 45.0792]}
        className="flex-1 h-full w-full z-[2]"
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution='&copy; <a href="https://www.saferoad.com.sa">Saferoad</a>'
        />
      </MapContainer>
    </div>
  );
};

export default MapInner;
