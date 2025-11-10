"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VehicleStatusSelect({ value, onValueChange }) {
  const VEHICLE_STATUSES = [
    {
      value: "all",
      label: "All",
      count: 12,
    },
    {
      value: "Running",
      label: "Running",
      count: 5,
    },
    {
      value: "Stopped",
      label: "Stopped",
      count: 6,
    },
    {
      value: "Invalid_Locations",
      label: "Invalid Locations",
      count: 14,
    },
    {
      value: "Idling",
      label: "Idling",
      count: 12,
    },
    {
      value: "Over_Speed",
      label: "Over Speed",
      count: 9,
    },
    {
      value: "Over_Street_Speed",
      label: "Over Street Speed",
      count: 6,
    },
    {
      value: "Sleep_mode",
      label: "Sleep mode",
      count: 12,
    },
    {
      value: "Offline",
      label: "Offline",
      count: 33,
    },
    {
      value: "Exceeding",
      label: "Late End",
      count: 22,
    },
    {
      value: "Accepted",
      label: "Accepted",
      count: 15,
    },
    {
      value: "Unavailable",
      label: "Unavailable",
      count: 7,
    },
  ];
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
