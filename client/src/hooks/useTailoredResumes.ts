import { useState, useEffect } from "react";
import type { TailoredResumesResponse } from "@apply-wise/shared";
import type { TailoredResumeItem } from "@apply-wise/shared";
import useApiClient from "src/lib/useApiClient";

// Fetches user's tailored resumes list
export default function useTailoredResumes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [data, setData] = useState<TailoredResumeItem[] | undefined>();
  const api = useApiClient();

  useEffect(() => {
    const getTailoredResumes = async () => {
      setLoading(true);

      try {
        const data: TailoredResumesResponse =
          await api.get("/resumes/tailored");
        setData(data.resumes);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve tailored resumes",
        );
      } finally {
        setLoading(false);
      }
    };

    getTailoredResumes();
  }, [api]);

  return { data, loading, error };
}
