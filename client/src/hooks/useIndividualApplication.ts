import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ApplicationResponse } from "@apply-wise/shared";
import useApiClient from "src/lib/useApiClient";

// Fetches individual user application
export default function useIndividualApplication(id: string) {
  const navigate = useNavigate();
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationResponse | null>(
    null,
  );
  const api = useApiClient();

  useEffect(() => {
    const getIndividualApplication = async () => {
      setLoading(true);

      try {
        const data: ApplicationResponse = await api.get(`/applications/${id}`);
        setApplication(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve user application",
        );
      } finally {
        setLoading(false);
      }
    };

    getIndividualApplication();
  }, [id, navigate, api]);

  return { application, loading, error };
}
