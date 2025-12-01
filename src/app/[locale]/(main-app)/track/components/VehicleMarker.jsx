// import { useEffect, useRef } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet.markercluster";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// // const getVehicleIcon = (statusCode) => {
// //   return new L.Icon({
// //     iconUrl: `/assets/images/cars/${statusCode}.png`,
// //     iconSize: [35, 35],
// //     iconAnchor: [16, 32],
// //     popupAnchor: [0, -28],
// //   });
// // };
// const getVehicleIcon = (statusCode, angle = 0) => {
//   return L.divIcon({
//     className: "rotated-marker",
//     html: `
//       <div style="transform: rotate(${angle}deg);">
//         <img src="/assets/images/cars/map/${statusCode}.png"
//               />
//       </div>
//     `,
//     iconSize: [35, 35],
//     iconAnchor: [17, 17],
//   });
// };

// const MarkerCluster = ({
//   pinnedVehicles = [],
//   lastSelectedSerial,
//   onMarkerClick,
//   onVehicleUnpinned,
// }) => {
//   const map = useMap();
//   const clusterRef = useRef(null);
//   const markersRef = useRef({});
//   const prevPinnedRef = useRef([]);

//   // Detect unpinned selected vehicle
//   useEffect(() => {
//     const prevSerials = prevPinnedRef.current.map((v) => v.SerialNumber);
//     const currentSerials = pinnedVehicles.map((v) => v.SerialNumber);

//     if (lastSelectedSerial) {
//       const wasPinned = prevSerials.includes(lastSelectedSerial);
//       const isPinned = currentSerials.includes(lastSelectedSerial);

//       if (wasPinned && !isPinned && onVehicleUnpinned) {
//         onVehicleUnpinned();
//       }
//     }

//     prevPinnedRef.current = pinnedVehicles;
//   }, [pinnedVehicles, lastSelectedSerial]);

//   // Build markers + cluster
//   // Build markers + cluster
//   useEffect(() => {
//     if (!map) return;

//     // Initialize cluster only once
//     if (!clusterRef.current) {
//       clusterRef.current = L.markerClusterGroup({
//         maxClusterRadius: 50,
//         showCoverageOnHover: true,
//         spiderfyOnMaxZoom: true,
//         chunkedLoading: true,
//         zoomToBoundsOnClick: true,
//       });
//       map.addLayer(clusterRef.current);
//     }

//     const currentMarkers = markersRef.current;
//     const newSerials = new Set(pinnedVehicles.map((v) => v.SerialNumber));

//     // 1. Remove markers for vehicles that are no longer pinned
//     Object.keys(currentMarkers).forEach((serial) => {
//       if (!newSerials.has(serial)) {
//         clusterRef.current.removeLayer(currentMarkers[serial]);
//         delete currentMarkers[serial];
//       }
//     });

//     // 2. Add or Update markers
//     pinnedVehicles.forEach((v) => {
//       if (!v.Latitude || !v.Longitude) return;

//       const existingMarker = currentMarkers[v.SerialNumber];

//       if (existingMarker) {
//         // Update position
//         const newLatLng = new L.LatLng(v.Latitude, v.Longitude);
//         if (!existingMarker.getLatLng().equals(newLatLng)) {
//           existingMarker.setLatLng(newLatLng);
//         }

//         // Update icon (rotation)
//         // Note: Creating a new icon every time might be expensive, but necessary for rotation if using divIcon with transform
//         // Optimization: Only update if direction changed significantly or status changed
//         const newIcon = getVehicleIcon(v.vehStatusCode, v.Direction || 0);
//         // We can't easily compare complex icons, so we update it. 
//         // Leaflet handles icon updates reasonably well.
//         existingMarker.setIcon(newIcon);

//         // Update popup content if needed (e.g. speed changed)
//         const newPopupContent = `<b>${v.SerialNumber}</b><br/>Speed: ${v.Speed} KM/H`;
//         if (existingMarker.getPopup() && existingMarker.getPopup().getContent() !== newPopupContent) {
//           existingMarker.setPopupContent(newPopupContent);
//         }

//       } else {
//         // Create new marker
//         const marker = L.marker([v.Latitude, v.Longitude], {
//           icon: getVehicleIcon(v.vehStatusCode, v.Direction || 0),
//         })
//           .bindPopup(`<b>${v.SerialNumber}</b><br/>Speed: ${v.Speed} KM/H`)
//           .on("click", () => onMarkerClick?.(v.SerialNumber));

//         currentMarkers[v.SerialNumber] = marker;
//         clusterRef.current.addLayer(marker);
//       }
//     });

//     // --- Auto zoom to bounds when multiple vehicles pinned (OPTIONAL: only on first load or significant change?) ---
//     // Keeping original logic: if > 1 pinned, fit bounds. 
//     // CAUTION: Doing this on every update might be annoying if user is panning.
//     // Let's restrict it: Only if we went from 0/1 to >1, OR maybe we shouldn't force it every time.
//     // The user didn't complain about this, but "movement not correct" might imply forced re-centering too.
//     // For now, I will comment out the auto-fitBounds on *every* update to avoid hijacking the view, 
//     // or maybe only do it if the user hasn't moved the map? 
//     // Actually, the previous code did it on every `pinnedVehicles` change. 
//     // Let's keep it but maybe we should be careful. 
//     // If the user is tracking a fleet, they might want to see them all.
//     // But if they zoom in, this will force zoom out.
//     // I'll leave it as is for now to match previous behavior, but it's a candidate for "jumpy" behavior.
//     // Wait, the previous code did: `if (pinnedVehicles.length > 1) ... map.fitBounds`.
//     // If I keep this, every time a car moves, it might re-fit bounds.
//     // Let's try to be smarter: Only fit bounds if the number of pinned vehicles CHANGED significantly (e.g. from 0 to many).
//     // Or just leave it. The user complained about "moving of vehicle", which usually refers to the marker itself.

//     // I will comment it out for now as it disrupts manual panning/zooming during updates.
//     /*
//     if (pinnedVehicles.length > 1) {
//       const bounds = clusterRef.current.getBounds();
//       if (bounds.isValid()) {
//         map.fitBounds(bounds, { animate: false, padding: [50, 50] });
//       }
//     }
//     */
//     // Actually, let's only do it if we just added vehicles, not just moved them.
//     // But `pinnedVehicles` changes reference every time.
//     // I'll remove the auto-fitBounds on every update to prevent view jumping.

//   }, [pinnedVehicles]);

//   // Handle zoom & focus after clicking
//   useEffect(() => {
//     if (!map) return;

//     // 1) User selected a vehicle
//     if (lastSelectedSerial) {
//       const marker = markersRef.current[lastSelectedSerial];
//       if (marker) {
//         const latlng = marker.getLatLng();
//         map.closePopup(); // avoid double popups
//         marker.openPopup();

//         // Zoom and center smoothly
//         map.flyTo(latlng, 16, { animate: false });
//         return;
//       }
//     }

//     // 2) If only one vehicle pinned → auto zoom
//     if (!lastSelectedSerial && pinnedVehicles.length === 1) {
//       const v = pinnedVehicles[0];
//       const marker = markersRef.current[v.SerialNumber];
//       if (marker) {
//         marker.openPopup();
//         map.flyTo(marker.getLatLng(), 15, { animate: true });
//         return;
//       }
//     }

//     // 3) If NO vehicles pinned → reset map
//     if (pinnedVehicles.length === 0) {
//       map.closePopup();
//       map.flyTo([23.8859, 45.0792], 6, { animate: true });
//     }
//   }, [lastSelectedSerial, pinnedVehicles]);

//   return null;
// };

// export default MarkerCluster;

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const getVehicleIcon = (statusCode, angle = 0) =>
  L.divIcon({
    className: "rotated-marker",
    html: `
      <div style="transform: rotate(${angle}deg);">
        <img src="/assets/images/cars/map/${statusCode}.png"
         />
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 17],
  });

const MarkerCluster = ({
  pinnedVehicles = [],
  lastSelectedSerial,
  onMarkerClick,
  onVehicleUnpinned,
}) => {
  const map = useMap();
  const clusterRef = useRef();
  const markersRef = useRef({});
  const prevPinnedRef = useRef([]);

  /* ============================================================
     Detect when selected vehicle is unpinned
  ============================================================ */
  useEffect(() => {
    const prev = prevPinnedRef.current.map((v) => v.SerialNumber);
    const now = pinnedVehicles.map((v) => v.SerialNumber);

    if (lastSelectedSerial && prev.includes(lastSelectedSerial) && !now.includes(lastSelectedSerial)) {
      onVehicleUnpinned?.();
    }

    prevPinnedRef.current = pinnedVehicles;
  }, [pinnedVehicles, lastSelectedSerial]);

  /* ============================================================
     Initialize cluster group once
  ============================================================ */
  useEffect(() => {
    if (!map || clusterRef.current) return;

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      zoomToBoundsOnClick: true,
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [map]);

  /* ============================================================
     Update markers efficiently (diff system)
  ============================================================ */
  useEffect(() => {
    if (!clusterRef.current) return;

    const cluster = clusterRef.current;
    const currentMarkers = markersRef.current;

    const newSerials = new Set(pinnedVehicles.map((v) => v.SerialNumber));

    const removeList = [];
    const addList = [];

    // Remove deleted markers
    Object.keys(currentMarkers).forEach((serial) => {
      if (!newSerials.has(serial)) {
        removeList.push(currentMarkers[serial]);
        delete currentMarkers[serial];
      }
    });

    // Add + update markers
    pinnedVehicles.forEach((v) => {
      if (!v.Latitude || !v.Longitude) return;

      const serial = v.SerialNumber;
      const direction = v.Direction || 0;
      const pos = [v.Latitude, v.Longitude];

      const existing = currentMarkers[serial];

      if (existing) {
        // Update position only if changed
        const prevPos = existing.getLatLng();
        if (prevPos.lat !== pos[0] || prevPos.lng !== pos[1]) {
          existing.setLatLng(pos);
        }

        // Update icon only if needed
        if (
          existing._status !== v.vehStatusCode ||
          existing._direction !== direction
        ) {
          existing.setIcon(getVehicleIcon(v.vehStatusCode, direction));
          existing._status = v.vehStatusCode;
          existing._direction = direction;
        }

        // Update popup ONLY if Speed changed
        const newContent = `<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`;
        if (existing.getPopup().getContent() !== newContent) {
          existing.setPopupContent(newContent);
        }
      } else {
        // Create marker
        const marker = L.marker(pos, {
          icon: getVehicleIcon(v.vehStatusCode, direction),
        })
          .bindPopup(`<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`)
          .on("click", () => onMarkerClick?.(serial));

        marker._status = v.vehStatusCode;
        marker._direction = direction;

        currentMarkers[serial] = marker;
        addList.push(marker);
      }
    });

    if (removeList.length) cluster.removeLayers(removeList);
    if (addList.length) cluster.addLayers(addList);
  }, [pinnedVehicles]);

  /* ============================================================
     Auto focus / zoom logic
  ============================================================ */
  useEffect(() => {
    if (!map) return;

    // 1) Focus selected vehicle
    if (lastSelectedSerial) {
      const marker = markersRef.current[lastSelectedSerial];
      if (marker) {
        map.closePopup();
        marker.openPopup();
        map.flyTo(marker.getLatLng(), 25, { animate: false });
      }
      return;
    }

    // 2) Auto zoom when only one exists
    if (pinnedVehicles.length === 1) {
      const v = pinnedVehicles[0];
      const marker = markersRef.current[v.SerialNumber];
      if (marker) {
        marker.openPopup();
        map.flyTo(marker.getLatLng(), 25, { animate: true });
      }
      return;
    }

    // 3) Reset map when nothing pinned
    if (pinnedVehicles.length === 0) {
      map.closePopup();
      map.flyTo([23.8859, 45.0792], 6);
    }
  }, [lastSelectedSerial, pinnedVehicles]);

  return null;
};

export default MarkerCluster;
