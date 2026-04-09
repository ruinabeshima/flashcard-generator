import { useState, useEffect } from "react";
import type { ResumeUrlResponse } from "@apply-wise/shared";
import useApiClient from "src/lib/useApiClient";

// Fetches user's resume link
export default function useResumeLink() {
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const api = useApiClient();

  useEffect(() => {
    const getResumeLink = async () => {
      setLoading(true);

      try {
        const data: ResumeUrlResponse = await api.get("/resumes");
        const { url } = data;
        setUrl(url);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to retrieve resume",
        );
      } finally {
        setLoading(false);
      }
    };

    getResumeLink();
  }, [api]);

  return { url, loading, error };
}
