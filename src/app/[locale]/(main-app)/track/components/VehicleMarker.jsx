// import { Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import { useMemo, useEffect, useRef } from "react";

// const VehicleMarker = ({ vehicle }) => {
//   const markerRef = useRef(null);

//   const customIcon = useMemo(
//     () =>
//       new L.Icon({
//         iconUrl: `/assets/images/cars/${vehicle.vehStatusCode}.png`,
//         iconSize: [35, 35],
//         iconAnchor: [16, 32],
//         popupAnchor: [0, -32],
//       }),
//     [vehicle.vehStatusCode]
//   );

//   // Update marker position when vehicle moves
//   useEffect(() => {
//     if (markerRef.current) {
//       markerRef.current.setLatLng([vehicle.Latitude, vehicle.Longitude]);
//     }
//   }, [vehicle.Latitude, vehicle.Longitude]);

//   return (
//     <Marker
//       ref={markerRef}
//       position={[vehicle.Latitude, vehicle.Longitude]}
//       icon={customIcon}
//     >
//       <Popup>
//         <b>{vehicle.SerialNumber}</b>
//         <br />
//         Status: {vehicle.vehStatusCode}
//       </Popup>
//     </Marker>
//   );
// };
// export default VehicleMarker;
import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
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

    // Clear previous markers
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

  return null;
};
export default MarkerCluster;
