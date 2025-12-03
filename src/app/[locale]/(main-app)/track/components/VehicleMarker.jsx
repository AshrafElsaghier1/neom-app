
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

    // 3) Just close popup when nothing pinned (preserve user's view)
    if (pinnedVehicles.length === 0) {
      map.closePopup();
      // Removed automatic flyTo to preserve user's current map view
     return;}
  }, [lastSelectedSerial, pinnedVehicles]);

  return null;
};

export default MarkerCluster;
