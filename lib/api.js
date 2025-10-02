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
    const finalHeaders = {
      ...headers,
    };

    // handle body + content-type
    let finalBody = undefined;
    if (body instanceof FormData) {
      finalBody = body;
    } else if (body) {
      finalBody = JSON.stringify(body);
      finalHeaders["Content-Type"] = "application/json";
    }

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

// ✅ Example API usage
export const api = {
  getAllVehicles: (token) =>
    universalFetch("/vehicle/tracking?limit=1000", { token }),

  // updateVehicle: (id, body, token) =>
  //   universalFetch(`/vehicle/${id}`, { method: "PUT", body, token }),
};
