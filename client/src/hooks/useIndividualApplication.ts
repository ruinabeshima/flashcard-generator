import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

interface Application {
  id: string;
  role: string;
  company: string;
  status: string;
  appliedDate: string;
  notes: string | null;
  jobUrl: string | null;
}

export default function useIndividualApplication(id: string) {
  const navigate = useNavigate();
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();

  useEffect(() => {
    const getIndividualApplication = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/applications/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError("Failed to retrieve application");
          return;
        }

        const data = await response.json();
        setApplication(data);
      } catch {
        setError("Failed to retrieve applications");
      } finally {
        setLoading(false);
      }
    };

    getIndividualApplication();
  }, [getToken, id, appUrl, navigate]);

  return { application, loading, error };
}
