const getVehicleIcon = (statusCode) => {
  return new L.Icon({
    iconUrl: `/assets/images/cars/${statusCode}.png`,
    iconSize: [35, 35],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
};

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const MarkerCluster = ({ pinnedVehicles = [], lastSelectedSerial }) => {
  const map = useMap();
  const clusterRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!map) return;

    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      map.removeLayer(clusterRef.current);
    }

    clusterRef.current = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      chunkedLoading: true,
    });

    pinnedVehicles.forEach((v) => {
      const { SerialNumber, Latitude, Longitude, Speed, vehStatusCode } = v;
      if (!Latitude || !Longitude) return;

      const marker = L.marker([Latitude, Longitude], {
        icon: getVehicleIcon(vehStatusCode),
      }).bindPopup(`<b>${SerialNumber}</b><br/>Speed: ${Speed} KM/H`);

      markersRef.current[SerialNumber] = marker;
      clusterRef.current.addLayer(marker);
    });

    map.addLayer(clusterRef.current);
  }, [pinnedVehicles]);

  // --- When user selects one vehicle (focus on it) ---
  useEffect(() => {
    if (!map) return;

    // If user selected specific vehicle
    if (lastSelectedSerial && markersRef.current[lastSelectedSerial]) {
      const marker = markersRef.current[lastSelectedSerial];
      const latlng = marker.getLatLng();

      map.closePopup();
      marker.openPopup();
      map.setView(latlng, 15, { animate: true });
      return;
    }

    // If only one vehicle pinned → auto zoom to it
    if (pinnedVehicles.length === 1) {
      const v = pinnedVehicles[0];
      const marker = markersRef.current[v.SerialNumber];
      if (marker) {
        map.closePopup();
        marker.openPopup();
        map.setView(marker.getLatLng(), 15, { animate: true });
      }
    }
  }, [lastSelectedSerial, pinnedVehicles]);

  return null;
};

export default MarkerCluster;
