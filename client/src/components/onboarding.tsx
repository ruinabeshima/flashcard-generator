import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ResumeUpload from "./resume_upload";

export default function Onboarding() {
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const appUrl = import.meta.env.VITE_SERVER_URL;

    const getOnboardingStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/auth/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to retrieve onboarding data",
          );
        }

        const { onboardingComplete } = await response.json();
        if (onboardingComplete) {
          navigate("/dashboard");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occured");
        }
      }
    };

    getOnboardingStatus();
  }, [getToken, navigate]);

  return <ResumeUpload />;
}
