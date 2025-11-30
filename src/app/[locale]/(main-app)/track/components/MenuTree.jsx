import { Logs, X } from "lucide-react";
import React, { useState } from "react";
import { VehicleStatusSelect } from "./VehicleStatusSelect";
import VehicleTree from "./VehicleTree";

const MenuTree = ({ setLastSelectedSerial }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState("all");
  const [lastSelectedSerial, setLocalLastSelectedSerial] = useState(null);

  const handleStatusChange = (newStatus) => {
    setVehicleStatus(newStatus !== "all" ? +newStatus : "all");
  };

  // Handler for tree selection change
  const handleLastSelectedSerialChange = (serial) => {
    setLocalLastSelectedSerial(serial);
    if (setLastSelectedSerial) setLastSelectedSerial(serial);
  };

  return (
    <>
      <aside
        className={`fixed right-0 top-[72px] h-[calc(100vh-72px)] w-[365px] z-6 
       border-l border-sidebar-border shadow-xl transform 
          transition-transform duration-300 ease-in-out p-4 bg-sidebar/70  dark:bg-sidebar/95  backdrop-blur-lg
          ${
            isMenuOpen
              ? "translate-x-0"
              : "rtl:-translate-x-full translate-x-full"
          }`}
      >
        <div className="flex  gap-2 flex-col">
          <label className="text-sm font-medium">Vehicles Status</label>
          <VehicleStatusSelect
            value={vehicleStatus}
            onValueChange={handleStatusChange}
          />

          <div className="max-w-full ">
            <VehicleTree
              statusFilter={vehicleStatus}
              onLastSelectedSerialChange={handleLastSelectedSerialChange}
            />
          </div>
        </div>
      </aside>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={` cursor-pointer fixed top-20 z-6 p-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg 
          ${
            isMenuOpen
              ? " bg-sidebar/80 backdrop-blur-lg  right-[364px] rounded-r-none"
              : "bg-main text-white right-4"
          }
        `}
      >
        {isMenuOpen ? <X strokeWidth={0.9} size={20} /> : <Logs size={20} />}
      </button>
    </>
  );
};

export default MenuTree;
