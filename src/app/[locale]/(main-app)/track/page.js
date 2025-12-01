"use client";
import React, { useState } from "react";
import MapInner from "./components/mapContainer";
import MenuTree from "./components/MenuTree";
// import { data } from "@/data";

const Track = () => {
  const [lastSelectedSerial, setLastSelectedSerial] = useState(null);

  const handleVehicleUnpinned = () => {
    setLastSelectedSerial(null);
  };

  return (
    <section>
      <MenuTree setLastSelectedSerial={setLastSelectedSerial} />
      <MapInner
        lastSelectedSerial={lastSelectedSerial}
        onMarkerClick={setLastSelectedSerial}
        onVehicleUnpinned={handleVehicleUnpinned}
      />
    </section>
  );
};

export default Track;
