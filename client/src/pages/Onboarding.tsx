import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ResumeUpload from "../components/ResumeUpload";
import Navbar from "../components/Navbar";
import ApplicationForm from "../components/ApplicationForm";

export default function Onboarding() {
  const [page, setPage] = useState(1);
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
          setError("Failed to retreive onboarding data");
          return;
        }

        const { onboardingComplete } = await response.json();
        if (onboardingComplete) {
          navigate("/dashboard");
        }
      } catch {
        setError("Failed to retreive onboarding data");
      }
    };

    getOnboardingStatus();
  }, [getToken, navigate]);

  return (
    <div className="flex flex-col w-full min-h-screen gap-5">
      <Navbar />

      <main className="flex flex-col items-center gap-10">
        <div className="flex justify-center items-center">
          <h1 className="text-4xl font-bold">Set up your account</h1>
        </div>

        {page === 1 && (
          <ResumeUpload isOnboarding={true} onSuccess={() => setPage(2)} />
        )}
        {page === 2 && (
          <ApplicationForm
            isOnboarding={true}
            onSkip={() => navigate("/dashboard")}
          />
        )}
        <p>{error}</p>
      </main>
    </div>
  );
}
