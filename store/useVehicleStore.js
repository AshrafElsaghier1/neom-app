import { create } from "zustand";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { io } from "socket.io-client";

// --- Shared update buffer
let updateBuffer = {};
let updateTimer = null;

// --- Merge helper
const mergeVehicleUpdates = (vehicles, updates) => {
  const map = new Map(vehicles.map((v) => [v.id || v.SerialNumber, v]));
  for (const veh of updates) {
    const key = veh.id || veh.SerialNumber;
    if (!key) continue;
    const existing = map.get(key) || {};
    map.set(key, { ...existing, ...veh });
  }
  return Array.from(map.values());
};

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,
  socket: null,
  isConnected: false,

  // --- Fetch vehicles
  fetchVehicles: async (force = false) => {
    const { loading, vehicles, initSocket, closeSocket, isConnected } = get();
    if (loading) return;
    if (!force && vehicles.length > 0) {
      // Ensure socket started only once
      if (!isConnected) initSocket();
      return;
    }

    set({ loading: true, error: null });

    try {
      const { data, error, status } = await api.getAllVehicles();
      if (error || status >= 400)
        throw new Error(error || `Request failed (${status})`);
      if (!Array.isArray(data))
        throw new Error("Invalid response format (expected array)");

      set({ vehicles: data, loading: false, error: null });

      // ✅ Only init socket if vehicles exist
      if (data.length > 0) {
        initSocket();
      } else {
        closeSocket();
      }
    } catch (err) {
      console.error("Vehicle fetch error:", err);
      toast.error(err.message || "Failed to fetch vehicles");
      set({ error: err.message, loading: false });
      closeSocket();
    }
  },

  // --- Initialize Socket (no duplicates)
  initSocket: () => {
    const { vehicles, socket, isConnected } = get();

    // ✅ Skip if already connected
    if (socket && isConnected) {
      console.debug("Socket already connected — skipping re-init");
      return;
    }

    // ✅ Skip if no vehicles
    if (!vehicles || vehicles.length === 0) {
      console.warn("No vehicles to track. Socket will not connect.");
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;
    if (!SOCKET_URL) {
      toast.error("Missing NEXT_PUBLIC_SOCKET_IO_URL");
      return;
    }

    // 🔒 Clean up any old socket before creating a new one
    socket?.off?.();
    socket?.disconnect?.();

    const newSocket = io(`${SOCKET_URL}/consumer`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    // --- Events
    newSocket.on("connect", () => {
      set({ isConnected: true });
      console.debug("Socket connected");

      const serials = vehicles.map((v) => v.SerialNumber).filter(Boolean);
      serials.forEach((s) => newSocket.emit("track", { serial: s }));
    });

    newSocket.on("disconnect", () => {
      console.debug("Socket disconnected");
      set({ isConnected: false });
    });

    newSocket.on("reconnect", () => {
      const serials = get()
        .vehicles.map((v) => v.SerialNumber)
        .filter(Boolean);
      serials.forEach((s) => newSocket.emit("track", { serial: s }));
    });

    newSocket.on("update", (updateData) => {
      const updates = Array.isArray(updateData) ? updateData : [updateData];
      for (const v of updates) {
        const key = v.id || v.SerialNumber;
        if (key) updateBuffer[key] = v;
      }

      if (!updateTimer) {
        updateTimer = setTimeout(() => {
          const pending = Object.values(updateBuffer);
          updateBuffer = {};
          updateTimer = null;
          if (pending.length === 0) return;

          set((state) => ({
            vehicles: mergeVehicleUpdates(state.vehicles, pending),
          }));
        }, 250);
      }
    });

    set({ socket: newSocket });
  },

  // --- Close Socket
  closeSocket: () => {
    const { socket, isConnected } = get();
    if (!socket && !isConnected) return;
    socket?.off?.();
    socket?.disconnect?.();
    set({ socket: null, isConnected: false });
  },
}));
