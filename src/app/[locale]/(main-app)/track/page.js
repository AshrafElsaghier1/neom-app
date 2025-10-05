"use client";
import { api } from "@/lib/api";
import MapInner from "./components/mapContainer";
import { ChevronLeft, ChevronRight, Logs } from "lucide-react";
import { useEffect, useState } from "react";
import MenuTree from "./components/MenuTree";

const Track = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [vehicles, setVehicles] = useState([]);

  // useEffect(() => {
  //   async function fetchVehicles() {
  //     const { data } = await api.getAllVehicles();

  //     setVehicles(data.docs || []);
  //   }
  //   fetchVehicles();
  // }, []);

  return (
    <section>
      <MenuTree isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <MapInner />
    </section>
  );
};

export default Track;
