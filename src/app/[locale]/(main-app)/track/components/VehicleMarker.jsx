
import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const MarkerCluster = ({ pinnedVehicles, lastSelectedSerial }) => {
  const map = useMap();
  const clusterGroupRef = useRef(L.markerClusterGroup());
  const markersRef = useRef({});

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();
    markersRef.current = {};

    pinnedVehicles.forEach((v) => {
      const marker = L.marker([v.Latitude, v.Longitude], {
        icon: new L.Icon({
          iconUrl: `/assets/images/cars/${v.vehStatusCode}.png`,
          iconSize: [35, 35],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        }),
      }).bindPopup(`<b>${v.SerialNumber}</b><br>Status: ${v.Speed}`);
      markersRef.current[v.SerialNumber] = marker;
      clusterGroup.addLayer(marker);
    });
    map.addLayer(clusterGroup);

    // Zoom and popup for last selected vehicle
    if (lastSelectedSerial && markersRef.current[lastSelectedSerial]) {
      const marker = markersRef.current[lastSelectedSerial];
      marker.openPopup();
      map.setView(marker.getLatLng(), 15, { animate: true });
    }

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [pinnedVehicles, map, lastSelectedSerial]);

  return null;
};

export default MarkerCluster;