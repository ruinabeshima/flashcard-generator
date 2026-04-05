import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function useOnboardingStatus() {
  const navigate = useNavigate();
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError("Failed to get onboarding status");
          return;
        }

        const data = await response.json();
        if (!data.onboardingComplete) {
          navigate("/onboarding");
        }
      } catch {
        setError("Failed to get onboarding status");
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [getToken, navigate, appUrl]);

  return { loading, error };
}
