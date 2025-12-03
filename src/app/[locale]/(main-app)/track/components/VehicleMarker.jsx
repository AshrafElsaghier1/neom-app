
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

  // Controls whether map should refocus
  const shouldRefitRef = useRef(false);

  /* --------------------------------------------------------------
      Disable auto-refit when user moves or zooms the map
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!map) return;

    const stopAuto = () => {
      shouldRefitRef.current = false;
    };

    map.on("zoomstart", stopAuto);
    map.on("movestart", stopAuto);

    return () => {
      map.off("zoomstart", stopAuto);
      map.off("movestart", stopAuto);
    };
  }, [map]);

  /* --------------------------------------------------------------
      Detect when a vehicle is unpinned
  -------------------------------------------------------------- */
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
  }, [pinnedVehicles, lastSelectedSerial, onVehicleUnpinned]);

  /* --------------------------------------------------------------
      Enable Auto-Focus when user selects a GROUP / BULK / ALL
  -------------------------------------------------------------- */
  useEffect(() => {
    const prevCount = prevPinnedRef.current.length;
    const nowCount = pinnedVehicles.length;

    // If user added more vehicles → auto-focus
    if (nowCount > prevCount) {
      shouldRefitRef.current = true;
    }

    prevPinnedRef.current = pinnedVehicles;
  }, [pinnedVehicles]);

  /* --------------------------------------------------------------
      Create cluster group once
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
      Add / Update / Remove markers
  -------------------------------------------------------------- */
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

    // Add + Update
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

        const popupContent = `<b>${serial}</b><br/>Speed: ${v.Speed} KM/H`;
        if (existing.getPopup().getContent() !== popupContent) {
          existing.setPopupContent(popupContent);
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

  /* --------------------------------------------------------------
      Auto-Focus Logic for:
      - Single Vehicles
      - Groups
      - All
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!map) return;

    const markers = markersRef.current;
    const prevSelected = prevSelectedRef.current;
    prevSelectedRef.current = lastSelectedSerial;

    // If user selected a new vehicle
    if (lastSelectedSerial !== prevSelected) {
      shouldRefitRef.current = true;
    }

    // If user has moved the map → stop auto-focus
    if (!shouldRefitRef.current) return;

    map.closePopup();

    /* ---- 1) Focus on SINGLE vehicle ---- */
    if (lastSelectedSerial) {
      const m = markers[lastSelectedSerial];
      if (m) {
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: true });
      }
      return;
    }

    /* ---- 2) Zero vehicles → do nothing ---- */
    if (pinnedVehicles.length === 0) return;

    /* ---- 3) Single selected vehicle (without lastSelectedSerial) ---- */
    if (pinnedVehicles.length === 1) {
      const v = pinnedVehicles[0];
      const m = markers[v.SerialNumber];
      if (m) {
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: false });
      }
      return;
    }

    /* ---- 4) Multiple vehicles → fit bounds ---- */
    const bounds = L.latLngBounds([]);

    pinnedVehicles.forEach((v) => {
      const m = markers[v.SerialNumber];
      if (m) bounds.extend(m.getLatLng());
    });

    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [50, 50], animate: false });
    }
  }, [lastSelectedSerial, pinnedVehicles, map]);

  return null;
};

export default MarkerCluster;
