"use client";
import React, { useState } from "react";
import MapInner from "./components/mapContainer";
import MenuTree from "./components/MenuTree";
// import { data } from "@/data";

const Track = () => {
  const [lastSelectedSerial, setLastSelectedSerial] = useState(null);
  return (
    <section>
      <MenuTree setLastSelectedSerial={setLastSelectedSerial} />
      <MapInner lastSelectedSerial={lastSelectedSerial} onMarkerClick={setLastSelectedSerial} />
    </section>
  );
};

export default Track;
