"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
const MapInner = () => {
  return (
    <MapContainer
      zoom={6}
      scrollWheelZoom={true}
      center={[23.8859, 45.0792]}
      className="h-[calc(100vh-72px)] w-full z-2"
    >
      <TileLayer
        url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
        attribution='&copy; <a href="https://www.saferoad.com.sa">Saferoad</a>'
      />

      {/* <Marker position={[51.505, -0.09]}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker> */}
    </MapContainer>
  );
};

export default MapInner;
