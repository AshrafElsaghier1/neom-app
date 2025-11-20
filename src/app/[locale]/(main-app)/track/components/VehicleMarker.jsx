import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMemo, useEffect, useRef } from "react";

const VehicleMarker = ({ vehicle }) => {
  const markerRef = useRef(null);

  const customIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: `/assets/images/cars/${vehicle.vehStatusCode}.png`,
        iconSize: [35, 35],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
    [vehicle.vehStatusCode]
  );

  // Update marker position when vehicle moves
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([vehicle.Latitude, vehicle.Longitude]);
    }
  }, [vehicle.Latitude, vehicle.Longitude]);

  return (
    <Marker
      ref={markerRef}
      position={[vehicle.Latitude, vehicle.Longitude]}
      icon={customIcon}
    >
      <Popup>
        <b>{vehicle.SerialNumber}</b>
        <br />
        Status: {vehicle.vehStatusCode}
      </Popup>
    </Marker>
  );
};
export default VehicleMarker;
