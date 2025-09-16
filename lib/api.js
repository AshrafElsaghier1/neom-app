import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function serverFetch(url, options = {}) {
  const {
    requireAuth = true,
    method = "GET",
    body,
    headers: customHeaders = {},
    timeout = 30000,
    ...rest
  } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const headers = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (requireAuth) {
      const session = await getServerSession(authOptions);

      if (!session) {
        clearTimeout(id); // Clear timeout if no session
        return {
          error: "Authentication required",
          status: 401,
        };
      }

      if (session.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    const fetchOptions = {
      method,
      headers,
      signal: controller.signal,
      ...rest,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
      `http://94.249.112.61:83/v1${url}`,
      fetchOptions
    );

    clearTimeout(id);

    if (!response.ok) {
      return {
        error: `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }
    const res = await response.json();

    return {
      data: res.data,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(id);

    if (error.name === "AbortError") {
      return {
        error: "Request timed out",
        status: 408,
      };
    }
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}

export async function getUser(id) {
  return serverFetch(`/api/users/${id}`);
}

export async function fetchDataWithAuth() {
  return serverFetch(
    `/trip/history?startDate=2025-05-30T09:12:22Z&endDate=2025-06-29T09:12:22Z`
  );
}

export async function getProfile() {
  return serverFetch("/api/profile");
}
export async function getSectors() {
  return serverFetch(`/sector?page=1&limit=10&search`);
}
export async function getReels() {
  return serverFetch(`/reel`);
}
export async function getObjectionTransactionReason() {
  return serverFetch(`/objection-transaction-reason`);
}
export async function getAllObjectionTransaction() {
  return serverFetch(`/common/objection-transaction`);
}
export async function getConfigurations() {
  return serverFetch(`/configuration/all`);
}
export async function getStatistics() {
  return serverFetch(`/common/get-statistics`);
}
export async function getProfiles() {
  return serverFetch(`/common/get-profiles`);
}
export async function getHelpCenterQuestions() {
  return serverFetch(`/common/help-center-question`);
}
