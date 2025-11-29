// import React, { useEffect, useRef, useState } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet.markercluster";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// const MarkerCluster = ({ pinnedVehicles, lastSelectedSerial }) => {
//   const map = useMap();
//   const clusterGroupRef = useRef(L.markerClusterGroup());
//   const markersRef = useRef({});

//   useEffect(() => {
//     const clusterGroup = clusterGroupRef.current;
//     clusterGroup.clearLayers();
//     markersRef.current = {};

//     pinnedVehicles.forEach((v) => {
//       const marker = L.marker([v.Latitude, v.Longitude], {
//         icon: new L.Icon({
//           iconUrl: `/assets/images/cars/${v.vehStatusCode}.png`,
//           iconSize: [35, 35],
//           iconAnchor: [16, 32],
//           popupAnchor: [0, -32],
//         }),
//       }).bindPopup(`<b>${v.SerialNumber}</b><br>Status: ${v.Speed}`);
//       markersRef.current[v.SerialNumber] = marker;
//       clusterGroup.addLayer(marker);
//     });
//     map.addLayer(clusterGroup);

//     // Open popups for all selected vehicles (and keep them open on updates)
//     pinnedVehicles.forEach((vehicle) => {
//       const marker = markersRef.current[vehicle.SerialNumber];
//       if (marker && !marker.isPopupOpen()) {
//         marker.openPopup();
//       }
//     });

//     // Enhanced zoom/focus logic - prioritizes last selected vehicle
//     if (lastSelectedSerial && markersRef.current[lastSelectedSerial]) {
//       // Always zoom to the last selected vehicle when it exists
//       const marker = markersRef.current[lastSelectedSerial];
//       map.setView(marker.getLatLng(), 25, { animate: true });
//     } else if (pinnedVehicles.length > 1) {
//       // Multiple vehicles selected but no specific lastSelectedSerial: fit bounds to all
//       const bounds = pinnedVehicles.map(v => [v.Latitude, v.Longitude]);
//       map.fitBounds(bounds, { padding: [60, 60], animate: true });
//     } else if (pinnedVehicles.length === 1) {
//       // Single vehicle selected: zoom to it
//       const vehicle = pinnedVehicles[0];
//       const marker = markersRef.current[vehicle.SerialNumber];
//       if (marker) {
//         map.setView(marker.getLatLng(), 25, { animate: true });
//       }
//     }

//     return () => {
//       map.removeLayer(clusterGroup);
//     };
//   }, [pinnedVehicles, map, lastSelectedSerial]);

//   return null;
// };

// export default MarkerCluster;
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const MarkerCluster = ({ pinnedVehicles, lastSelectedSerial }) => {
  const map = useMap();

  // Refs for ultra-fast performance
  const clusterGroupRef = useRef(null);
  const markersRef = useRef({});
  const previousVehiclesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const iconCacheRef = useRef({});
  const autoZoomDisabledRef = useRef(false);
  const lastSelectionCountRef = useRef(0);

  // Memoize vehicle serials to detect actual changes
  const vehicleSerials = useMemo(() =>
    pinnedVehicles.map(v => v.SerialNumber).sort(),
    [pinnedVehicles]
  );

  // Cache icons - HUGE performance boost
  const getIcon = useCallback((statusCode) => {
    if (!iconCacheRef.current[statusCode]) {
      iconCacheRef.current[statusCode] = new L.Icon({
        iconUrl: `/assets/images/cars/${statusCode}.png`,
        iconSize: [35, 35],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    }
    return iconCacheRef.current[statusCode];
  }, []);

  // Initialize cluster group once
  useEffect(() => {
    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 16,
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 25,
      maxClusterRadius: 50,
    });
    map.addLayer(clusterGroupRef.current);

    // Disable auto-zoom when user manually moves map
    const disableZoom = () => { autoZoomDisabledRef.current = true; };
    map.on("movestart", disableZoom);
    map.on("zoomstart", disableZoom);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.off("movestart", disableZoom);
      map.off("zoomstart", disableZoom);
      map.removeLayer(clusterGroupRef.current);
    };
  }, [map]);

  // Ultra-fast marker update logic
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for buttery smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const currentSerials = vehicleSerials;
      const previousSerials = previousVehiclesRef.current;

      // Check if vehicles actually changed (not just positions)
      const vehiclesChanged = JSON.stringify(currentSerials) !== JSON.stringify(previousSerials);

      if (!vehiclesChanged && pinnedVehicles.length === previousVehiclesRef.current.length) {
        // 🚀 LIGHTNING FAST: Only update positions, don't recreate markers
        pinnedVehicles.forEach((v) => {
          const marker = markersRef.current[v.SerialNumber];
          if (marker) {
            const currentPos = marker.getLatLng();
            const newPos = L.latLng(v.Latitude, v.Longitude);
            if (!currentPos.equals(newPos)) {
              marker.setLatLng(newPos);
            }
          }
        });
      } else {
        // Full rebuild only when vehicles are added/removed
        clusterGroup.clearLayers();
        markersRef.current = {};

        // Batch create markers for better performance
        const markersToAdd = pinnedVehicles.map((v) => {
          const marker = L.marker([v.Latitude, v.Longitude], {
            icon: getIcon(v.vehStatusCode),
          }).bindPopup(`<b>${v.SerialNumber}</b><br>Status: ${v.Speed}`);

          markersRef.current[v.SerialNumber] = marker;
          return marker;
        });

        clusterGroup.addLayers(markersToAdd);
      }

      // Update previous state
      previousVehiclesRef.current = [...currentSerials];

      // Smart popup management - only for single vehicle
      if (pinnedVehicles.length === 1) {
        const vehicle = pinnedVehicles[0];
        const marker = markersRef.current[vehicle.SerialNumber];
        if (marker && !marker.isPopupOpen()) {
          marker.openPopup();
        }
      }

      // 🔥 Detect selection-change event
      const selectionChanged =
        pinnedVehicles.length !== lastSelectionCountRef.current ||
        lastSelectedSerial;

      // Update selection count
      lastSelectionCountRef.current = pinnedVehicles.length;

      // 🚀 ALWAYS zoom on selection change
      if (selectionChanged) {
        autoZoomDisabledRef.current = false; // allow zoom for this selection

        if (lastSelectedSerial && markersRef.current[lastSelectedSerial]) {
          map.setView(markersRef.current[lastSelectedSerial].getLatLng(), 25);
          return;
        }

        if (pinnedVehicles.length > 1) {
          const bounds = pinnedVehicles.map(v => [v.Latitude, v.Longitude]);
          map.fitBounds(bounds, { padding: [60, 60] });
          return;
        }

        if (pinnedVehicles.length === 1) {
          const m = markersRef.current[pinnedVehicles[0].SerialNumber];
          if (m) map.setView(m.getLatLng(), 25);
          return;
        }
      }

      // ⛔ Stop GPS auto-zoom after user moved map
      if (autoZoomDisabledRef.current) return;

      // 🚀 Auto zoom before user touches map
      if (pinnedVehicles.length > 1) {
        const bounds = pinnedVehicles.map(v => [v.Latitude, v.Longitude]);
        map.fitBounds(bounds, { padding: [60, 60] });
      } else if (pinnedVehicles.length === 1) {
        const m = markersRef.current[pinnedVehicles[0].SerialNumber];
        if (m) map.setView(m.getLatLng(), 25);
      }
    });

  }, [pinnedVehicles, vehicleSerials, lastSelectedSerial, getIcon]);

  return null;
};

export default MarkerCluster;