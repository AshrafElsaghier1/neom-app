
// import { useEffect, useRef } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet.markercluster";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// const getVehicleIcon = (statusCode, angle = 0) =>
//   L.divIcon({
//     className: "rotated-marker",
//     html: `
//       <div style="transform: rotate(${angle}deg); transition: transform 0.3s ease;">
//         <img src="/assets/images/cars/map/${statusCode}.png"/>
//       </div>
//     `,
//     iconSize: [35, 35],
//     iconAnchor: [17, 17],
//   });

// const MarkerCluster = ({
//   pinnedVehicles = [],
//   lastSelectedSerial,
//   onMarkerClick,
//   onVehicleUnpinned,
// }) => {
//   const map = useMap();
//   const clusterRef = useRef();
//   const markersRef = useRef({});
//   const prevPinnedRef = useRef([]);
//   const prevSelectedRef = useRef(null);

//   useEffect(() => {
//     const prev = prevPinnedRef.current.map((v) => v.SerialNumber);
//     const now = pinnedVehicles.map((v) => v.SerialNumber);

//     if (
//       lastSelectedSerial &&
//       prev.includes(lastSelectedSerial) &&
//       !now.includes(lastSelectedSerial)
//     ) {
//       onVehicleUnpinned?.();
//     }

//     prevPinnedRef.current = pinnedVehicles;
//   }, [pinnedVehicles, lastSelectedSerial, onVehicleUnpinned]);

//   useEffect(() => {
//     if (!map || clusterRef.current) return;

//     const cluster = L.markerClusterGroup({
//       maxClusterRadius: 50,
//       spiderfyOnMaxZoom: false,
//       chunkedLoading: false,
//       zoomToBoundsOnClick: false,
//     });

//     map.addLayer(cluster);
//     clusterRef.current = cluster;

//     // Cleanup on unmount
//     return () => {
//       if (clusterRef.current) {
//         map.removeLayer(clusterRef.current);
//         clusterRef.current = null;
//       }
//     };
//   }, [map]);


//   useEffect(() => {
//     if (!clusterRef.current) return;

//     const cluster = clusterRef.current;
//     const currentMarkers = markersRef.current;

//     const newSerials = new Set(pinnedVehicles.map((v) => v.SerialNumber));

//     const removeList = [];
//     const addList = [];

//     // Remove deleted markers
//     Object.keys(currentMarkers).forEach((serial) => {
//       if (!newSerials.has(serial)) {
//         removeList.push(currentMarkers[serial]);
//         delete currentMarkers[serial];
//       }
//     });

//     // Add + update markers
//     pinnedVehicles.forEach((v) => {
//       if (!v.Latitude || !v.Longitude) return;

//       const serial = v.SerialNumber;
//       const direction = v.Direction || 0;
//       const pos = [v.Latitude, v.Longitude];

//       const existing = currentMarkers[serial];

//       if (existing) {
//         // Update position
//         const prevPos = existing.getLatLng();
//         if (prevPos.lat !== pos[0] || prevPos.lng !== pos[1]) {
//           existing.setLatLng(pos);
//         }

//         // Update icon only if needed
//         if (
//           existing._status !== v.vehStatusCode ||
//           existing._direction !== direction
//         ) {
//           existing.setIcon(getVehicleIcon(v.vehStatusCode, direction));
//           existing._status = v.vehStatusCode;
//           existing._direction = direction;
//         }

//         // Update popup only if speed changed
//         const newContent = `<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`;
//         if (existing.getPopup().getContent() !== newContent) {
//           existing.setPopupContent(newContent);
//         }
//       } else {
//         // Create marker
//         const marker = L.marker(pos, {
//           icon: getVehicleIcon(v.vehStatusCode, direction),
//         })
//           .bindPopup(`<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`)
//           .on("click", () => onMarkerClick?.(serial));

//         marker._status = v.vehStatusCode;
//         marker._direction = direction;

//         currentMarkers[serial] = marker;
//         addList.push(marker);
//       }
//     });

//     if (removeList.length) cluster.removeLayers(removeList);
//     if (addList.length) cluster.addLayers(addList);
//   }, [pinnedVehicles, onMarkerClick]);


//   useEffect(() => {
//     if (!map) return;

//     const markers = markersRef.current;
//     const prevSelected = prevSelectedRef.current;


//     prevSelectedRef.current = lastSelectedSerial;

//     if (lastSelectedSerial) {
//       const m = markers[lastSelectedSerial];

//       if (m) {
//         map.closePopup();
//         m.openPopup();
//         map.flyTo(m.getLatLng(), 14, { animate: false });
//       }
//       return;
//     }

//     if (prevSelected && !lastSelectedSerial) {
//       map.closePopup();


//       if (pinnedVehicles.length === 0) {
//         return;
//       } else if (pinnedVehicles.length === 1) {

//         const v = pinnedVehicles[0];
//         const m = markers[v.SerialNumber];
//         if (m) {
//           map.flyTo(m.getLatLng(), 14, { animate: false });
//         }
//         return;
//       } else {

//         const bounds = L.latLngBounds([]);
//         pinnedVehicles.forEach((v) => {
//           const m = markers[v.SerialNumber];


//           if (m) bounds.extend(m.getLatLng());
//         });

//         if (bounds.isValid()) {
//           map.flyToBounds(bounds, { padding: [50, 50], animate: false });
//         }
//         return;
//       }
//     }

//     if (pinnedVehicles.length === 1) {
//       const v = pinnedVehicles[0];
//       const m = markers[v.SerialNumber];
//       if (m) {
//         map.closePopup();
//         m.openPopup();
//         map.flyTo(m.getLatLng(), 14, { animate: false });
//       }
//       return;
//     }

//     if (pinnedVehicles.length > 1) {
//       const bounds = L.latLngBounds([]);
//       pinnedVehicles.forEach((v) => {
//         const m = markers[v.SerialNumber];
//         if (m) bounds.extend(m.getLatLng());
//       });

//       if (bounds.isValid()) {
//         map.closePopup();
//         map.flyToBounds(bounds, { padding: [50, 50], animate: false });
//       }
//       return;
//     }

//     if (pinnedVehicles.length === 0) {
//       map.closePopup();
//       return;
//     }
//   }, [lastSelectedSerial, pinnedVehicles, map]);

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
      <div style="transform: rotate(${angle}deg); transition: transform 0.3s ease;">
        <img src="/assets/images/cars/map/${statusCode}.png"/>
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
  const prevSelectedRef = useRef(null);

  // 🔥 NEW: controls automatic refocusing behavior
  const shouldRefitRef = useRef(true);

  useEffect(() => {
    const prev = prevPinnedRef.current.map((v) => v.SerialNumber);
    const now = pinnedVehicles.map((v) => v.SerialNumber);

    if (
      lastSelectedSerial &&
      prev.includes(lastSelectedSerial) &&
      !now.includes(lastSelectedSerial)
    ) {
      onVehicleUnpinned?.();
    }

    prevPinnedRef.current = pinnedVehicles;
  }, [pinnedVehicles, lastSelectedSerial, onVehicleUnpinned]);

  useEffect(() => {
    if (!map || clusterRef.current) return;

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: false,
      chunkedLoading: false,
      zoomToBoundsOnClick: false,
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [map]);

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

    // Add & update
    pinnedVehicles.forEach((v) => {
      if (!v.Latitude || !v.Longitude) return;

      const serial = v.SerialNumber;
      const direction = v.Direction || 0;
      const pos = [v.Latitude, v.Longitude];

      const existing = currentMarkers[serial];

      if (existing) {
        const prevPos = existing.getLatLng();
        if (prevPos.lat !== pos[0] || prevPos.lng !== pos[1]) {
          existing.setLatLng(pos);
        }

        if (
          existing._status !== v.vehStatusCode ||
          existing._direction !== direction
        ) {
          existing.setIcon(getVehicleIcon(v.vehStatusCode, direction));
          existing._status = v.vehStatusCode;
          existing._direction = direction;
        }

        const newContent = `<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`;
        if (existing.getPopup().getContent() !== newContent) {
          existing.setPopupContent(newContent);
        }
      } else {
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
  }, [pinnedVehicles, onMarkerClick]);

  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;
    const prevSelected = prevSelectedRef.current;

    prevSelectedRef.current = lastSelectedSerial;

    // If selecting a single vehicle explicitly
    if (lastSelectedSerial) {
      const m = markers[lastSelectedSerial];

      if (m) {
        map.closePopup();
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: false });
      }
      return;
    }

    // Removing a previously selected vehicle
    if (prevSelected && !lastSelectedSerial) {
      map.closePopup();

      if (pinnedVehicles.length === 0) {
        shouldRefitRef.current = true; // reset
        return;
      } else if (pinnedVehicles.length === 1) {
        const v = pinnedVehicles[0];
        const m = markers[v.SerialNumber];
        if (m) map.flyTo(m.getLatLng(), 20, { animate: false });
        return;
      } else {
        const bounds = L.latLngBounds([]);
        pinnedVehicles.forEach((v) => {
          const m = markers[v.SerialNumber];
          if (m) bounds.extend(m.getLatLng());
        });

        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], animate: false });
        }
        return;
      }
    }

    // If zero vehicles pinned
    if (pinnedVehicles.length === 0) {
      map.closePopup();
      shouldRefitRef.current = true; // 🔥 reset, so next "select all" refocuses
      return;
    }

    // If exactly one vehicle
    if (pinnedVehicles.length === 1) {
      const v = pinnedVehicles[0];
      const m = markers[v.SerialNumber];
      if (m) {
        map.closePopup();
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: false });
      }
      return;
    }

    // If multiple vehicles
    if (pinnedVehicles.length > 1) {
      const bounds = L.latLngBounds([]);

      pinnedVehicles.forEach((v) => {
        const m = markers[v.SerialNumber];
        if (m) bounds.extend(m.getLatLng());
      });

      if (bounds.isValid()) {
        if (shouldRefitRef.current) {
          map.closePopup();
          map.flyToBounds(bounds, { padding: [50, 50], animate: false });

          shouldRefitRef.current = false;
        }
      }
      return;
    }
  }, [lastSelectedSerial, pinnedVehicles, map]);

  return null;
};

export default MarkerCluster;
