import { useState, useEffect } from "react";
import { useAuth } from "./auth";

interface TailoredResume {
  id: string;
  name: string;
  applicationId: string;
  createdAt: string;
}

interface TailoredResumeResponse {
  resumes: TailoredResume[];
}

export default function useTailoredResumes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<TailoredResume[]>([]);
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

        const data: TailoredResumeResponse = await response.json();
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
