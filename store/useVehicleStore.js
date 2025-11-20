// import { create } from "zustand";
// import { io } from "socket.io-client";
// import { api } from "@/lib/api";
// import { CalcVehicleStatus } from "@/lib/utils";
// import { toast } from "sonner";

// const initializeVehicleMap = (vehiclesArray) => {
//   const map = new Map();
//   for (const v of vehiclesArray) {
//     if (!v?.SerialNumber) continue;
//     map.set(v.SerialNumber, {
//       ...v,
//       vehStatusCode: CalcVehicleStatus(v),
//     });
//   }
//   return map;
// };

// // ---------------- VEHICLE STORE ----------------
// export const useVehicleStore = create((set, get) => {
//   let rafPending = false;
//   let rafBuffer = new Map();
//   let rafId = null;

//   let lastTrackTime = 0;
//   const TRACK_THROTTLE = 2000;

//   const processRafBuffer = () => {
//     rafId = null;
//     if (!rafBuffer.size) {
//       rafPending = false;
//       return;
//     }

//     set((state) => {
//       const updatedMap = new Map(state.vehicles);

//       for (const [serial, update] of rafBuffer) {
//         const existing = updatedMap.get(serial);
//         if (!existing) continue;

//         const incomingDate = update.__incomingDate;
//         const currentDate = new Date(existing.RecordDateTime);

//         // accept only newer updates
//         if (incomingDate > currentDate) {
//           const cleanUpdate = { ...update };
//           delete cleanUpdate.__incomingDate;
//           const mergedData = { ...existing, ...cleanUpdate };

//           updatedMap.set(serial, {
//             ...mergedData,
//             vehStatusCode: CalcVehicleStatus(cleanUpdate),
//           });
//         }
//       }

//       rafBuffer.clear();
//       rafPending = false;

//       return { vehicles: updatedMap };
//     });
//   };

//   const scheduleRaf = () => {
//     if (!rafPending) {
//       rafPending = true;
//       rafId = setTimeout(processRafBuffer, 2500);
//     }
//   };

//   const closeSocketSafe = () => {
//     if (rafId) clearTimeout(rafId);

//     rafPending = false;
//     rafBuffer.clear();

//     const socket = get().socket;
//     if (!socket) return;

//     socket.off("connect");
//     socket.off("disconnect");
//     socket.off("reconnect");
//     socket.off("update");

//     socket.disconnect();

//     set({
//       socket: null,
//       isConnected: false,
//     });
//   };

//   return {
//     vehicles: new Map(),
//     loading: false,
//     error: null,
//     socket: null,
//     isConnected: false,

//     fetchVehicles: async (force = false) => {
//       const { loading, vehicles, initSocket, isConnected } = get();
//       if (loading) return;
//       if (!force && vehicles.size) return isConnected || initSocket();

//       set({ loading: true, error: null });

//       try {
//         const { data, error, status } = await api.getAllVehicles();
//         if (error || status >= 400) {
//           throw new Error(error || `Request failed (${status})`);
//         }
//         if (!Array.isArray(data)) throw new Error("Invalid vehicle data");

//         const map = initializeVehicleMap(data);

//         set({
//           vehicles: map,
//           loading: false,
//           error: null,
//         });

//         map.size ? initSocket() : closeSocketSafe();
//       } catch (err) {
//         console.error("Vehicle fetch error:", err);
//         const msg = err.message || "Failed to fetch vehicles";
//         toast.error(msg);

//         set({ error: msg, loading: false });
//         closeSocketSafe();
//       }
//     },

//     initSocket: () => {
//       const { vehicles, socket, isConnected } = get();

//       if (socket && isConnected) return;
//       if (!vehicles.size) return;

//       const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;
//       if (!SOCKET_URL) return toast.error("Missing NEXT_PUBLIC_SOCKET_IO_URL");

//       if (socket) closeSocketSafe();

//       const newSocket = io(`${SOCKET_URL}/consumer`, {
//         transports: ["websocket"],
//         reconnection: true,
//       });

//       const trackAllVehicles = () => {
//         const now = Date.now();
//         if (now - lastTrackTime < TRACK_THROTTLE) return;
//         lastTrackTime = now;

//         const vehKeys = get().vehicles.keys();
//         for (const serial of vehKeys) {
//           newSocket.emit("track", { serial });
//         }
//       };

//       newSocket.on("connect", () => {
//         set({ isConnected: true });
//         trackAllVehicles();
//       });

//       newSocket.on("disconnect", () => {
//         set({ isConnected: false });
//       });

//       newSocket.on("reconnect", () => {
//         trackAllVehicles();
//       });

//       newSocket.on("update", (updateData) => {
//         const list = Array.isArray(updateData) ? updateData : [updateData];
//         const currentMap = get().vehicles;

//         for (const v of list) {
//           if (!v?.SerialNumber || !v?.RecordDateTime) continue;

//           if (!currentMap.has(v.SerialNumber)) continue;

//           rafBuffer.set(v.SerialNumber, {
//             ...v,
//             __incomingDate: new Date(v.RecordDateTime),
//           });
//         }

//         scheduleRaf();
//       });

//       set({ socket: newSocket });
//     },

//     closeSocket: closeSocketSafe,
//   };
// });
import { create } from "zustand";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { CalcVehicleStatus } from "@/lib/utils";
import { toast } from "sonner";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;
const initializeVehicleMap = (vehiclesArray) => {
  const map = new Map();
  const statusCounts = {}; // ADDED

  for (const v of vehiclesArray) {
    if (!v?.SerialNumber) continue;

    const code = CalcVehicleStatus(v);
    statusCounts[code] = (statusCounts[code] || 0) + 1;

    map.set(v.SerialNumber, {
      ...v,
      vehStatusCode: code,
    });
  }
  return { map, statusCounts }; // ADDED
};

// ---------------- VEHICLE STORE ----------------
export const useVehicleStore = create((set, get) => {
  let rafPending = false;
  let rafBuffer = new Map();
  let rafId = null;

  let lastTrackTime = 0;
  const TRACK_THROTTLE = 2000;

  const processRafBuffer = () => {
    rafId = null;
    if (!rafBuffer.size) {
      rafPending = false;
      return;
    }

    set((state) => {
      const updatedMap = new Map(state.vehicles);
      const statusCounts = { ...state.statusCounts }; // ADDED

      for (const [serial, update] of rafBuffer) {
        const existing = updatedMap.get(serial);
        if (!existing) continue;

        const incomingDate = update.__incomingDate;
        const currentDate = new Date(existing.RecordDateTime);

        if (incomingDate > currentDate) {
          const cleanUpdate = { ...update };
          delete cleanUpdate.__incomingDate;

          const oldCode = existing.vehStatusCode;
          const newCode = CalcVehicleStatus(cleanUpdate);

          if (oldCode !== newCode) {
            statusCounts[oldCode] = (statusCounts[oldCode] || 1) - 1;
            statusCounts[newCode] = (statusCounts[newCode] || 0) + 1;
          }

          const mergedData = { ...existing, ...cleanUpdate };

          updatedMap.set(serial, {
            ...mergedData,
            vehStatusCode: newCode,
          });
        }
      }

      rafBuffer.clear();
      rafPending = false;

      return { vehicles: updatedMap, statusCounts };
    });
  };

  const scheduleRaf = () => {
    if (!rafPending) {
      rafPending = true;
      rafId = setTimeout(processRafBuffer, 2500);
    }
  };

  const closeSocketSafe = () => {
    if (rafId) clearTimeout(rafId);

    rafPending = false;
    rafBuffer.clear();

    const socket = get().socket;
    if (!socket) return;

    socket.off("connect");
    socket.off("disconnect");
    socket.off("reconnect");
    socket.off("update");

    socket.disconnect();

    set({
      socket: null,
      isConnected: false,
    });
  };

  return {
    vehicles: new Map(),
    statusCounts: {},
    loading: false,
    error: null,
    socket: null,
    isConnected: false,

    fetchVehicles: async (force = false) => {
      const { loading, vehicles, initSocket, isConnected } = get();
      if (loading) return;
      if (!force && vehicles.size) return isConnected || initSocket();

      set({ loading: true, error: null });

      try {
        const { data, error, status } = await api.getAllVehicles();
        if (error || status >= 400) {
          throw new Error(error || `Request failed (${status})`);
        }
        if (!Array.isArray(data)) throw new Error("Invalid vehicle data");

        const { map, statusCounts } = initializeVehicleMap(data);

        set({
          vehicles: map,
          statusCounts,
          loading: false,
          error: null,
        });

        map.size ? initSocket() : closeSocketSafe();
      } catch (err) {
        console.error("Vehicle fetch error:", err);
        const msg = err.message || "Failed to fetch vehicles";
        toast.error(msg);

        set({ error: msg, loading: false });
        closeSocketSafe();
      }
    },

    initSocket: () => {
      const { vehicles, socket, isConnected } = get();

      if (socket && isConnected) return;
      if (!vehicles.size) return;

      if (!SOCKET_URL) return toast.error("Missing NEXT_PUBLIC_SOCKET_IO_URL");

      if (socket) closeSocketSafe();

      const newSocket = io(`${SOCKET_URL}/consumer`, {
        transports: ["websocket"],
        reconnection: true,
      });

      const trackAllVehicles = () => {
        const now = Date.now();
        if (now - lastTrackTime < TRACK_THROTTLE) return;
        lastTrackTime = now;

        const vehKeys = get().vehicles.keys();
        for (const serial of vehKeys) {
          newSocket.emit("track", { serial });
        }
      };

      newSocket.on("connect", () => {
        set({ isConnected: true });
        trackAllVehicles();
      });

      newSocket.on("disconnect", () => {
        set({ isConnected: false });
      });

      newSocket.on("reconnect", () => {
        trackAllVehicles();
      });

      newSocket.on("update", (updateData) => {
        const list = Array.isArray(updateData) ? updateData : [updateData];
        const currentMap = get().vehicles;

        for (const v of list) {
          if (!v?.SerialNumber || !v?.RecordDateTime) continue;

          if (!currentMap.has(v.SerialNumber)) continue;

          rafBuffer.set(v.SerialNumber, {
            ...v,
            __incomingDate: new Date(v.RecordDateTime),
          });
        }

        scheduleRaf();
      });

      set({ socket: newSocket });
    },

    closeSocket: closeSocketSafe,
  };
});
