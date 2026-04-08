import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { ResumeSuggestions } from "@apply-wise/shared";

export default function useTailoredStatus(applicationId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [status, setStatus] = useState<null | string>(null);
  const [suggestions, setSuggestions] = useState<null | ResumeSuggestions>();
  const [sessionId, setSessionId] = useState<null | string>(null);
  const [tailoredResumeId, setTailoredResumeId] = useState<null | string>(null);
  const { getToken } = useAuth();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  const fetchTailoredStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(
        `${appUrl}/tailoring/status/${applicationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message);
        return;
      }

      const data = await response.json();
      if (data.status === "NONE") {
        setStatus(data.status);
        return;
      }

      if (data.status === "PENDING" || data.status === "REVIEWED") {
        setStatus(data.status);
        setSessionId(data.sessionId);
        setSuggestions(data.suggestions);
        return;
      }

      if (data.status === "TAILORED") {
        setStatus(data.status);
        setSessionId(data.sessionId);
        setTailoredResumeId(data.tailoredResumeId);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [appUrl, applicationId, getToken]);

  useEffect(() => {
    fetchTailoredStatus();
  }, [fetchTailoredStatus]);

  return {
    loading,
    error,
    status,
    suggestions,
    sessionId,
    tailoredResumeId,
    refetch: fetchTailoredStatus,
  };
}
