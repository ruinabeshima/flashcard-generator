import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { TailoredResumesResponse } from "@apply-wise/shared";
import type { TailoredResumeItem } from "@apply-wise/shared";

export default function useTailoredResumes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<TailoredResumeItem[] | undefined>();
  const { getToken } = useAuth();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const getTailoredResumes = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/resumes/tailored`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError(true);
          return;
        }

        const data: TailoredResumesResponse = await response.json();
        setData(data.resumes);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getTailoredResumes();
  }, [getToken, appUrl]);

  return { data, loading, error };
}
