"use client";
import MapInner from "./components/mapContainer";
import MenuTree from "./components/MenuTree";
// import { data } from "@/data";

const Track = () => {
  return (
    <section>
      <MenuTree />
      <MapInner />
    </section>
  );
};

export default Track;
