import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

export default function useTailoredResumeURL(tailoredResumeId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState<null | string>(null);
  const { getToken } = useAuth();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const getTailoredResumeURL = async () => {
      setLoading(true);

      try {
        if (!tailoredResumeId) {
          setError(true);
          return;
        }

        const token = await getToken();
        const response = await fetch(
          `${appUrl}/resumes/tailored/${tailoredResumeId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          setError(true);
          return;
        }

        const data = await response.json();
        setUrl(data.url);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getTailoredResumeURL();
  }, [tailoredResumeId, getToken, appUrl]);

  return { url, loading, error };
}
