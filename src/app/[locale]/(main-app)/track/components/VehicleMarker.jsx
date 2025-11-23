import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster"; // Import the plugin
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
const MarkerCluster = ({ vehicles }) => {
  const map = useMap();
  const clusterGroupRef = useRef(L.markerClusterGroup());

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;

    clusterGroup.clearLayers();

    vehicles.forEach((v) => {
      const marker = L.marker([v.Latitude, v.Longitude], {
        icon: new L.Icon({
          iconUrl: `/assets/images/cars/${v.vehStatusCode}.png`,
          iconSize: [35, 35],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        }),
      }).bindPopup(`<b>${v.SerialNumber}</b><br>Status: ${v.vehStatusCode}`);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [vehicles, map]);

  return;
};
export default MarkerCluster;
