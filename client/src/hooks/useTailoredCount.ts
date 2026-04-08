import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { TailoringCountResponse } from "@apply-wise/shared";

export default function useTailoredCount() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [count, setCount] = useState<number>();
  const { getToken } = useAuth();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const getTailoredCount = async () => {
      setError(false);
      setLoading(true);

      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/tailoring/count`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError(true);
          return;
        }

        const data: TailoringCountResponse = await response.json();
        setCount(data.count);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getTailoredCount();
  }, [getToken, appUrl]);

  return { count, loading, error };
}
