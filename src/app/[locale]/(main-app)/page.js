// import { api } from "@/lib/api";

// export default async function VehiclesPage() {
//   const { data, error } = await api.getAllVehicles();
//   console.log({ data });

//   if (error) {
//     return <p className="text-red-500">Error: {error}</p>;
//   }

//   return (
//     <ul>
//       {data.docs.map((v) => (
//         <li key={v._id}>{v.make}</li>
//       ))}
//     </ul>
//   );
// }

"use client";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export default function VehiclesClient() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    async function fetchVehicles() {
      const { data } = await api.getAllVehicles();

      setVehicles(data.docs || []);
    }
    fetchVehicles();
  }, []);

  return (
    <ul>
      {vehicles.map((v) => (
        <li key={v._id}>{v.make}</li>
      ))}
    </ul>
  );
}
