import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";

export default function useApiClient() {
  const { getToken } = useAuth();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  return useMemo(() => {
    // <T> = Any data type
    // RequestInit is a global type with fields method, headers, body, etc. Defaults to empty object
    const request = async <T>(
      endpoint: string,
      options: RequestInit = {},
    ): Promise<T> => {
      const token = await getToken();

      const response = await fetch(`${appUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return response.json();
    };

    // Return object with methods
    return {
      get: <T>(path: string) => request<T>(path),
      post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body) }),
      put: <T>(path: string, body: unknown) =>
        request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
      delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
    };
  }, [appUrl, getToken]);
}
