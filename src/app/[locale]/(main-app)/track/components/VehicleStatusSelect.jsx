"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VEHICLE_STATUSES = [
  { value: "available", label: "Available", count: 23 },
  { value: "in-transit", label: "In Transit", count: 33 },
  { value: "maintenance", label: "Maintenance", count: 13 },
  { value: "out-of-service", label: "Out of Service", count: 0 },
  { value: "reserved", label: "Reserved", count: 2 },
  { value: "loading", label: "Loading", count: 123 },
  { value: "unloading", label: "Unloading ", count: 232 },
  { value: "parked", label: "Parked", count: 26 },
];

export function VehicleStatusSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full  ">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {VEHICLE_STATUSES.map((status) => (
          <SelectItem
            key={status.value}
            value={status.value}
            label={status.label}
            count={status.count}
          />
        ))}
      </SelectContent>
    </Select>
  );
}
