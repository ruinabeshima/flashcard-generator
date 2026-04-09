import { useState, useEffect } from "react";
import useApiClient from "../lib/useApiClient";
import type { ResumeUrlResponse } from "@apply-wise/shared";

// Fetches tailored resume link
export default function useTailoredResumeURL(tailoredResumeId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [url, setUrl] = useState<null | string>(null);
  const api = useApiClient();

  useEffect(() => {
    const getTailoredResumeURL = async () => {
      setLoading(true);

      try {
        if (!tailoredResumeId) {
          setError("Missing tailored resume ID");
          return;
        }

        const data: ResumeUrlResponse = await api.get(
          `/resumes/tailored/${tailoredResumeId}`,
        );
        setUrl(data.url);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve tailored resume",
        );
      } finally {
        setLoading(false);
      }
    };

    getTailoredResumeURL();
  }, [tailoredResumeId, api]);

  return { url, loading, error };
}
