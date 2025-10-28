import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSession } from "next-auth/react";

async function resolveAuthToken() {
  const isServer = typeof window === "undefined";

  try {
    const session = isServer
      ? await getServerSession(authOptions)
      : await getSession();

    return session?.user?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function universalFetch(
  url,
  {
    method = "GET",
    body,
    headers = {},
    timeout = 30000,
    requireAuth = true,
    ...rest
  } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const finalHeaders = { ...headers };

    // Handle body and headers
    let finalBody;
    if (body instanceof FormData) {
      finalBody = body;
    } else if (body) {
      finalBody = JSON.stringify(body);
      finalHeaders["Content-Type"] = "application/json";
    }

    // Automatically attach auth token
    if (requireAuth) {
      const authToken = await resolveAuthToken();
      if (!authToken) {
        clearTimeout(timeoutId);
        return { error: "Authentication required", status: 401 };
      }
      finalHeaders.Authorization = `Bearer ${authToken}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
      ...rest,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let message = `HTTP error! status: ${response.status}`;
      let details = null;
      try {
        const errJson = await response.json();
        message = errJson.message || message;
        details = errJson;
      } catch {}
      return { error: message, status: response.status, details };
    }

    const json = await response.json().catch(() => null);
    return { data: json?.data ?? json, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      return { error: "Request timed out", status: 408 };
    }
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
      originalError: error,
    };
  }
}

export const api = {
  getAllVehicles: () =>
    universalFetch("vehicle/lastlocations", {
      method: "POST",
      body: {
        lite: 3,
        fields: [
          "SerialNumber",
          "Mileage",
          "Longitude",
          "Latitude",
          "RecordDateTime",
          "EngineStatus",
          "Speed",
          "Direction",
          "Address",
          "IButtonID",
          "DriverID",
          "RFID",
          "IsPowerCutOff",
          "IsFuelCutOff",
          "IsSOSHighJack",
          "IsCrash",
          "RPM",
          "CoolantTemp",
          "TotalMileage",
          "VIN",
          "FuelLevelLiter",
          "FuelLevelPer",
          "FuelPressure",
          "HybridVoltage",
          "Hum1",
          "Hum2",
          "Hum3",
          "Hum4",
          "Temp1",
          "Temp2",
          "Temp3",
          "Temp4",
          "Satellites",
          "DevConfig",
        ],
      },
    }),

  // updateVehicle: (id, body) =>
  //   universalFetch(`/vehicle/${id}`, { method: "PUT", body }),

  // deleteVehicle: (id) => universalFetch(`/vehicle/${id}`, { method: "DELETE" }),

  // createVehicle: (body) => universalFetch("/vehicle", { method: "POST", body }),
};
