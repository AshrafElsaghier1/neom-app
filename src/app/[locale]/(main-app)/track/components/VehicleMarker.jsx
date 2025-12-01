// import { useEffect, useRef } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet.markercluster";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// const getVehicleIcon = (statusCode) => {
//   return new L.Icon({
//     iconUrl: `/assets/images/cars/${statusCode}.png`,
//     iconSize: [35, 35],
//     iconAnchor: [16, 32],
//     popupAnchor: [0, -28],
//   });
// };

// const MarkerCluster = ({ pinnedVehicles = [], lastSelectedSerial, onMarkerClick, onVehicleUnpinned }) => {
//   const map = useMap();
//   const clusterRef = useRef(null);
//   const markersRef = useRef({});
//   const prevPinnedVehiclesRef = useRef([]);

//   // Detect when selected vehicle is unpinned
//   useEffect(() => {
//     if (lastSelectedSerial && onVehicleUnpinned) {
//       const prevSerials = prevPinnedVehiclesRef.current.map(v => v.SerialNumber);
//       const currentSerials = pinnedVehicles.map(v => v.SerialNumber);

//       // Check if selected vehicle was removed
//       const wasSelectedPreviously = prevSerials.includes(lastSelectedSerial);
//       const isSelectedCurrently = currentSerials.includes(lastSelectedSerial);

//       if (wasSelectedPreviously && !isSelectedCurrently) {
//         onVehicleUnpinned();
//       }
//     }

//     prevPinnedVehiclesRef.current = pinnedVehicles;
//   }, [pinnedVehicles, lastSelectedSerial, onVehicleUnpinned]);

//   useEffect(() => {
//     if (!map) return;

//     if (clusterRef.current) {
//       clusterRef.current.clearLayers();
//       map.removeLayer(clusterRef.current);
//     }

//     clusterRef.current = L.markerClusterGroup({
//       maxClusterRadius: 50,
//       showCoverageOnHover: false,
//       chunkedLoading: true,
//     });

//     pinnedVehicles.forEach((v) => {
//       const { SerialNumber, Latitude, Longitude, Speed, vehStatusCode } = v;
//       if (!Latitude || !Longitude) return;

//       const marker = L.marker([Latitude, Longitude], {
//         icon: getVehicleIcon(vehStatusCode),
//       })
//         .bindPopup(`<b>${SerialNumber}</b><br/>Speed: ${Speed} KM/H`)
//         .on('click', () => {
//           if (onMarkerClick) {
//             onMarkerClick(SerialNumber);
//           }
//         });

//       markersRef.current[SerialNumber] = marker;
//       clusterRef.current.addLayer(marker);
//     });

//     map.addLayer(clusterRef.current);
//   }, [pinnedVehicles, onMarkerClick]);

//   // --- When user selects one vehicle (focus on it) ---
//   useEffect(() => {
//     if (!map) return;

//     // If user selected specific vehicle and it's still pinned
//     if (lastSelectedSerial && markersRef.current[lastSelectedSerial]) {
//       const isStillPinned = pinnedVehicles.some(v => v.SerialNumber === lastSelectedSerial);
//       if (isStillPinned) {
//         const marker = markersRef.current[lastSelectedSerial];
//         const latlng = marker.getLatLng();

//         map.closePopup();
//         marker.openPopup();
//         map.setView(latlng, 15, { animate: true });
//         return;
//       }
//     }

//     // If only one vehicle pinned → auto zoom to it
//     if (pinnedVehicles.length === 1) {
//       const v = pinnedVehicles[0];
//       const marker = markersRef.current[v.SerialNumber];
//       if (marker) {
//         map.closePopup();
//         marker.openPopup();
//         map.setView(marker.getLatLng(), 15, { animate: true });
//       }
//     }

//     // If no vehicles pinned → reset view
//     if (pinnedVehicles.length === 0) {
//       map.closePopup();
//       map.setView([23.8859, 45.0792], 6, { animate: true });
//     }
//   }, [lastSelectedSerial, pinnedVehicles]);

//   return null;
// };

// export default MarkerCluster;

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

const MarkerCluster = ({
  pinnedVehicles = [],
  lastSelectedSerial,
  onMarkerClick,
  onVehicleUnpinned,
}) => {
  const map = useMap();
  const clusterRef = useRef(null);
  const markersRef = useRef({});
  const prevPinnedRef = useRef([]);

  // Detect unpinned selected vehicle
  useEffect(() => {
    const prevSerials = prevPinnedRef.current.map((v) => v.SerialNumber);
    const currentSerials = pinnedVehicles.map((v) => v.SerialNumber);

    if (lastSelectedSerial) {
      const wasPinned = prevSerials.includes(lastSelectedSerial);
      const isPinned = currentSerials.includes(lastSelectedSerial);

      if (wasPinned && !isPinned && onVehicleUnpinned) {
        onVehicleUnpinned();
      }
    }

    prevPinnedRef.current = pinnedVehicles;
  }, [pinnedVehicles, lastSelectedSerial]);

  // Build markers + cluster
  useEffect(() => {
    if (!map) return;

    // Clear old cluster
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      map.removeLayer(clusterRef.current);
    }

    // Create new cluster
    clusterRef.current = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: true,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      zoomToBoundsOnClick: true,
    });

    markersRef.current = {}; // reset markers

    pinnedVehicles.forEach((v) => {
      if (!v.Latitude || !v.Longitude) return;

      const marker = L.marker([v.Latitude, v.Longitude], {
        icon: getVehicleIcon(v.vehStatusCode),
      })
        .bindPopup(`<b>${v.SerialNumber}</b><br/>Speed: ${v.Speed} KM/H`)
        .on("click", () => {
          onMarkerClick?.(v.SerialNumber);
        });

      markersRef.current[v.SerialNumber] = marker;
      clusterRef.current.addLayer(marker);
    });

    map.addLayer(clusterRef.current);

    // --- Auto zoom to bounds when multiple vehicles pinned ---
    if (pinnedVehicles.length > 1) {
      const bounds = clusterRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { animate: false, padding: [50, 50] });
      }
    }
  }, [pinnedVehicles]);

  // Handle zoom & focus after clicking
  useEffect(() => {
    if (!map) return;

    // 1) User selected a vehicle
    if (lastSelectedSerial) {
      const marker = markersRef.current[lastSelectedSerial];
      if (marker) {
        const latlng = marker.getLatLng();
        map.closePopup(); // avoid double popups
        marker.openPopup();

        // Zoom and center smoothly
        map.flyTo(latlng, 16, { animate: false });
        return;
      }
    }

    // 2) If only one vehicle pinned → auto zoom
    if (!lastSelectedSerial && pinnedVehicles.length === 1) {
      const v = pinnedVehicles[0];
      const marker = markersRef.current[v.SerialNumber];
      if (marker) {
        marker.openPopup();
        map.flyTo(marker.getLatLng(), 15, { animate: true });
        return;
      }
    }

    // 3) If NO vehicles pinned → reset map
    if (pinnedVehicles.length === 0) {
      map.closePopup();
      map.flyTo([23.8859, 45.0792], 6, { animate: true });
    }
  }, [lastSelectedSerial, pinnedVehicles]);

  return null;
};

export default MarkerCluster;
