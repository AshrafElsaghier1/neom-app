import { create } from "zustand";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { CalcVehicleStatus } from "@/lib/utils";
import { toast } from "sonner";

const initializeVehicleMap = (vehiclesArray) => {
  const map = new Map();
  for (const v of vehiclesArray) {
    if (!v?.SerialNumber) continue;

    map.set(v.SerialNumber, { ...v, vehStatusCode: CalcVehicleStatus(v) });
  }

  return map;
};

// ---------------- VEHICLE STORE ----------------
export const useVehicleStore = create((set, get) => {
  let rafPending = false;
  let rafBuffer = new Map();
  let rafId = null;

  const processRafBuffer = () => {
    rafId = null;
    if (!rafBuffer.size) return (rafPending = false);

    set((state) => {
      const updatedMap = new Map(state.vehicles);
      for (const [serial, update] of rafBuffer) {
        const currentVehicle = updatedMap.get(serial);
        if (!currentVehicle) continue;
        updatedMap.set(serial, { ...currentVehicle, ...update });
      }
      rafBuffer.clear();
      rafPending = false;
      return { vehicles: updatedMap };
    });
  };

  const scheduleRaf = () => {
    if (!rafPending) {
      rafPending = true;
      rafId = requestAnimationFrame(processRafBuffer);
    }
  };

  const closeSocketSafe = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafPending = false;
    rafBuffer.clear();
    const socket = get().socket;
    if (!socket) return;
    socket.off();
    socket.disconnect();
    set({ socket: null, isConnected: false });
  };

  return {
    vehicles: new Map(),
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
        if (error || status >= 400)
          throw new Error(error || `Request failed (${status})`);
        if (!Array.isArray(data)) throw new Error("Invalid vehicles response");

        const map = initializeVehicleMap(data);
        set({ vehicles: map, loading: false, error: null });
        map.size ? initSocket() : closeSocketSafe();
      } catch (err) {
        console.log({ err });

        console.error("Vehicle fetch error:", err);
        const errorMessage = err.message || "Failed to fetch vehicles";
        toast.error(errorMessage);
        set({ error: errorMessage, loading: false });
        closeSocketSafe();
      }
    },

    initSocket: () => {
      const { vehicles, socket, isConnected } = get();
      if (socket && isConnected) return;
      if (!vehicles.size) return;

      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;
      if (!SOCKET_URL) return toast.error("Missing NEXT_PUBLIC_SOCKET_IO_URL");

      closeSocketSafe();

      const newSocket = io(`${SOCKET_URL}/consumer`, {
        transports: ["websocket"],
        reconnection: true,
      });

      const trackAllVehicles = () => {
        for (const serial of get().vehicles.keys())
          newSocket.emit("track", { serial });
      };

      newSocket.on("connect", () => {
        set({ isConnected: true });
        trackAllVehicles();
      });
      newSocket.on("disconnect", () => set({ isConnected: false }));
      newSocket.on("reconnect", trackAllVehicles);

      newSocket.on("update", (updateData) => {
        const list = Array.isArray(updateData) ? updateData : [updateData];
        for (const v of list) {
          if (!v?.SerialNumber) continue;
          try {
            rafBuffer.set(v.SerialNumber, {
              ...v,
              vehStatusCode: CalcVehicleStatus(v),
            });
          } catch (err) {
            console.error("Error processing socket update:", err);
          }
        }
        scheduleRaf();
      });

      set({ socket: newSocket });
    },

    closeSocket: closeSocketSafe,
  };
});
