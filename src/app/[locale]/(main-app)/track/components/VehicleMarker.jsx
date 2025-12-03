
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
    html: `<div style="transform: rotate(${angle}deg); transition: transform 0.3s ease;">
      <img src="/assets/images/cars/map/${statusCode}.png"/></div>`,
    iconSize: [35, 35],
    iconAnchor: [17, 17],
  });

const MarkerCluster = ({ pinnedVehicles = [], lastSelectedSerial, onMarkerClick, onVehicleUnpinned }) => {
  const map = useMap();
  const clusterRef = useRef();
  const markersRef = useRef({});
  const prevPinnedRef = useRef([]);
  const prevSelectedRef = useRef(null);
  const shouldRefitRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    const stopAuto = () => (shouldRefitRef.current = false);
    map.on("zoomstart movestart", stopAuto);
    return () => map.off("zoomstart movestart", stopAuto);
  }, [map]);

  useEffect(() => {
    const prev = prevPinnedRef.current.map(v => v.SerialNumber);
    const now = pinnedVehicles.map(v => v.SerialNumber);
    if (lastSelectedSerial && prev.includes(lastSelectedSerial) && !now.includes(lastSelectedSerial)) {
      onVehicleUnpinned?.();
    }
  }, [pinnedVehicles, lastSelectedSerial, onVehicleUnpinned]);

  useEffect(() => {
    if (pinnedVehicles.length > prevPinnedRef.current.length) {
      shouldRefitRef.current = true;
    }
    prevPinnedRef.current = pinnedVehicles;
  }, [pinnedVehicles]);

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
    const markers = markersRef.current;
    const newSerials = new Set(pinnedVehicles.map(v => v.SerialNumber));
    const removeList = [];
    const addList = [];

    Object.keys(markers).forEach(serial => {
      if (!newSerials.has(serial)) {
        removeList.push(markers[serial]);
        delete markers[serial];
      }
    });

    pinnedVehicles.forEach(v => {
      if (!v.Latitude || !v.Longitude) return;
      const { SerialNumber: serial, Direction: direction = 0, vehStatusCode, Speed } = v;
      const pos = [v.Latitude, v.Longitude];
      const existing = markers[serial];

      if (existing) {
        const prevPos = existing.getLatLng();
        if (prevPos.lat !== pos[0] || prevPos.lng !== pos[1]) existing.setLatLng(pos);
        if (existing._status !== vehStatusCode || existing._direction !== direction) {
          existing.setIcon(getVehicleIcon(vehStatusCode, direction));
          existing._status = vehStatusCode;
          existing._direction = direction;
        }
        const popupContent = `<b>${serial}</b><br/>Speed: ${Speed} KM/H`;
        if (existing.getPopup().getContent() !== popupContent) existing.setPopupContent(popupContent);
      } else {
        const marker = L.marker(pos, { icon: getVehicleIcon(vehStatusCode, direction) })
          .bindPopup(`<b>${serial}</b><br/>Speed: ${Speed} KM/H`)
          .on("click", () => onMarkerClick?.(serial));
        marker._status = vehStatusCode;
        marker._direction = direction;
        markers[serial] = marker;
        addList.push(marker);
      }
    });

    if (removeList.length) cluster.removeLayers(removeList);
    if (addList.length) cluster.addLayers(addList);
  }, [pinnedVehicles, onMarkerClick]);

  useEffect(() => {
    if (!map || !shouldRefitRef.current) return;
    const markers = markersRef.current;
    const prevSelected = prevSelectedRef.current;
    prevSelectedRef.current = lastSelectedSerial;

    if (lastSelectedSerial !== prevSelected) shouldRefitRef.current = true;
    if (!shouldRefitRef.current) return;

    map.closePopup();

    if (lastSelectedSerial) {
      const m = markers[lastSelectedSerial];
      if (m) {
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: true });
      }
      return;
    }

    if (pinnedVehicles.length === 0) return;

    if (pinnedVehicles.length === 1) {
      const m = markers[pinnedVehicles[0].SerialNumber];
      if (m) {
        m.openPopup();
        map.flyTo(m.getLatLng(), 14, { animate: false });
      }
      return;
    }

    const bounds = L.latLngBounds([]);
    pinnedVehicles.forEach(v => {
      const m = markers[v.SerialNumber];
      if (m) bounds.extend(m.getLatLng());
    });
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [50, 50], animate: false });
  }, [lastSelectedSerial, pinnedVehicles, map]);

  return null;
};

export default MarkerCluster;