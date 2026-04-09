import { useState, useEffect } from "react";
import type { ApplicationsResponse } from "@apply-wise/shared";
import useApiClient from "src/lib/useApiClient";

// Returns list of all the user's job applications
export default function useApplicationsList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [applications, setApplications] = useState<null | ApplicationsResponse>(
    null,
  );
  const api = useApiClient();

  useEffect(() => {
    const getApplicationsList = async () => {
      try {
        setLoading(true);
        const response: ApplicationsResponse = await api.get("/applications");
        setApplications(response);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve application list",
        );
      } finally {
        setLoading(false);
      }
    };

    getApplicationsList();
  }, [api]);

  return { applications: applications ?? [], loading, error };
}
