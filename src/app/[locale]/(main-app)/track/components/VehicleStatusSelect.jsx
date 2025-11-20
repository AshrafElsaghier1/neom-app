"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleStore } from "@/store/useVehicleStore";
import { CarFront } from "lucide-react";
import { useMemo } from "react";
const VEHICLE_STATUSES = [
  { value: "all", label: "All" },
  { value: 1, label: "Running" },
  { value: 0, label: "Stopped" },
  { value: 203, label: "Invalid Locations" },
  { value: 2, label: "Idling" },
  { value: 101, label: "Over Speed" },
  { value: 5, label: "Offline" },
  { value: 204, label: "Sleep mode" },
  // { value: 100, label: "Over Street Speed" },
  // { value: "exceeding", label: "Late End" },
  // { value: "accepted", label: "Accepted" },
  // { value: "unavailable", label: "Unavailable" },
];
export function VehicleStatusSelect({ value, onValueChange }) {
  const vehicleMap = useVehicleStore((s) => s.vehicles);
  const statusCounts = useVehicleStore((s) => s.statusCounts);

  const vehicles = useMemo(() => Array.from(vehicleMap.values()), [vehicleMap]);

  const enrichedStatuses = useMemo(() => {
    return VEHICLE_STATUSES.map((s) => ({
      ...s,
      count: s.value === "all" ? vehicles.length : statusCounts[s.value] || 0,
    }));
  }, [vehicles, statusCounts]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select status" className="w-full" />
      </SelectTrigger>

      <SelectContent>
        {enrichedStatuses.map(({ value: statusValue, label, count }, index) => (
          <SelectItem key={index} value={statusValue}>
            <div className="flex items-center justify-between w-full gap-2  ">
              <div className="flex items-center gap-2 min-w-0 w-full">
                <img
                  src={`/assets/images/cars/${statusValue}.png`}
                  alt={`vehicle-status-${statusValue}`}
                  loading="lazy"
                />
                <span className="truncate">{label}</span>
              </div>
              <span className="text-muted-foreground text-xs">{count}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
