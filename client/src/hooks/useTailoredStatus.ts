import { useState, useEffect, useCallback } from "react";
import useApiClient from "src/lib/useApiClient";
import type { ResumeSuggestions } from "@apply-wise/shared";
import type { TailoringStatusResponse } from "@apply-wise/shared";

export default function useTailoredStatus(applicationId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [status, setStatus] = useState<null | string>(null);
  const [suggestions, setSuggestions] = useState<null | ResumeSuggestions>();
  const [sessionId, setSessionId] = useState<null | string>(null);
  const [tailoredResumeId, setTailoredResumeId] = useState<null | string>(null);
  const api = useApiClient();

  const fetchTailoredStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: TailoringStatusResponse = await api.get(
        `/tailoring/status/${applicationId}`,
      );

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
  }, [applicationId, api]);

  useEffect(() => {
    fetchTailoredStatus();
  }, [fetchTailoredStatus, api]);

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
