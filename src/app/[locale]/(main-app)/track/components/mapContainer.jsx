"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster"; // Import the plugin
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { useVehicleStore } from "@/store/useVehicleStore";
import MarkerCluster from "./VehicleMarker";

// Marker Cluster Component

const MapInner = () => {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const pinned = useVehicleStore((s) => s.pinned);

  const pinnedVehicles = useMemo(() => {
    if (!vehicles || !vehicles.size) return [];
    return Array.from(pinned)
      .map((serial) => vehicles.get(serial))
      .filter(Boolean);
  }, [pinned, vehicles]);

  return (
    <div className="flex w-full h-[calc(100vh-72px)] z-1">
      <MapContainer
        zoom={6}
        scrollWheelZoom={true}
        center={[23.8859, 45.0792]}
        className="flex-1 h-full w-full z-1"
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution='&copy; <a href="https://www.saferoad.com.sa">Saferoad</a>'
        />

        {/* <MarkerCluster vehicles={pinnedVehicles} /> */}
      </MapContainer>
    </div>
  );
};

export default MapInner;
