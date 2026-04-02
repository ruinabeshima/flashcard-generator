import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export default function useResumeLink() {
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const getResumeLink = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/resumes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError("Failed to retrieve resume");
          return;
        }

        const { url } = await response.json();
        setUrl(url);
      } catch {
        setError("Failed to retreive resume");
      } finally {
        setLoading(false);
      }
    };

    getResumeLink();
  }, [getToken, appUrl, navigate]);

  return { url, loading, error };
}
