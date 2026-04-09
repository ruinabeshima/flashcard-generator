import { useState, useEffect } from "react";
import type { TailoringCountResponse } from "@apply-wise/shared";
import useApiClient from "../lib/useApiClient";

// Fetches number of user's tailoring sessions
export default function useTailoredCount() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [count, setCount] = useState<number>();
  const api = useApiClient();

  useEffect(() => {
    const getTailoredCount = async () => {
      setLoading(true);

      try {
        const data: TailoringCountResponse = await api.get("/tailoring/count");
        setCount(data.count);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve number of tailoring sessions",
        );
      } finally {
        setLoading(false);
      }
    };

    getTailoredCount();
  }, [api]);

  return { count, loading, error };
}
