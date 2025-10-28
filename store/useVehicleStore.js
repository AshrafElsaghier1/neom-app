import { create } from "zustand";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { io } from "socket.io-client";

// Buffers to batch incoming updates
let updateBuffer = {};
let updateTimer = null;

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,
  socket: null,
  isConnected: false,

  fetchVehicles: async (force = false) => {
    const { loading, vehicles } = get();
    if (loading || (!force && vehicles.length > 0)) return;

    set({ loading: true, error: null });

    try {
      const { data, error, status } = await api.getAllVehicles();

      if (error || status >= 400)
        throw new Error(error || `Request failed with status ${status}`);
      if (!Array.isArray(data))
        throw new Error("Invalid response format — expected an array.");

      set({ vehicles: data, loading: false, error: null });

      // Initialize socket *after* we have data
      const { socket, isConnected } = get();
      if (socket && isConnected) get().subscribeToAllVehicles(socket, data);
    } catch (err) {
      console.error("🚨 Vehicle fetch error:", err);
      toast.error(err.message || "Failed to fetch vehicles");
      set({ error: err.message, loading: false });
    }
  },

  // --- Initialize Socket ---
  initSocket: () => {
    const existing = get().socket;
    if (existing) existing.disconnect();

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;
    if (!SOCKET_URL) {
      toast.error("Missing NEXT_PUBLIC_SOCKET_IO_URL");
      return;
    }

    const TOKEN =
      "ed9a68532c60d1e503b78b8b268b22df:cf8e83772d9caff56178a1b394c48ca959dbd7f6ce7073ec4f9629bb0ff92679b9886e8d07ecdd758f21bd328c1e2f43";

    const socket = io(`${SOCKET_URL}/consumer`, {
      // auth: { token: TOKEN },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      set({ isConnected: true });

      // Subscribe to all vehicles after connect
      const { vehicles } = get();
      if (vehicles.length > 0) get().subscribeToAllVehicles(socket, vehicles);
    });

    socket.on("disconnect", (reason) => {
      console.warn("❌ Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("reconnect", () => {
      console.log("🔄 Socket reconnected");
      const { vehicles } = get();
      get().subscribeToAllVehicles(socket, vehicles);
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Connection Error:", err.message);
      toast.error("Socket connection failed");
    });

    // 🚗 Handle vehicle updates
    socket.on("update", (updateData) => {
      if (!updateData) return;

      // Single or multiple updates
      const updates = Array.isArray(updateData) ? updateData : [updateData];
      updates.forEach((v) => {
        if (!v.id && !v.SerialNumber) return;
        const key = v.id || v.SerialNumber;
        updateBuffer[key] = v;
      });

      // Batch updates to avoid re-render spam
      if (!updateTimer) {
        updateTimer = setTimeout(() => {
          const updates = Object.values(updateBuffer);
          updateBuffer = {};
          updateTimer = null;

          set((state) => {
            const map = new Map(
              state.vehicles.map((v) => [v.id || v.SerialNumber, v])
            );
            updates.forEach((u) => {
              const key = u.id || u.SerialNumber;
              const existing = map.get(key) || {};
              map.set(key, { ...existing, ...u });
            });
            return { vehicles: Array.from(map.values()) };
          });
        }, 300);
      }
    });

    set({ socket });
  },

  // --- Subscribe to all vehicles ---
  subscribeToAllVehicles: (socket, vehicles = []) => {
    if (!socket?.connected) {
      console.warn("⚠️ Socket not connected, skipping subscription");
      return;
    }

    const validVehicles = vehicles.filter((v) => v.SerialNumber);
    validVehicles.forEach((v) => {
      socket.emit("track", { serial: v.SerialNumber });
    });

    console.log(`📡 Subscribed to ${validVehicles.length} vehicles`);
  },

  // --- Close socket manually ---
  closeSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      console.log("🔌 Socket disconnected manually");
      set({ socket: null, isConnected: false });
    }
  },
}));
