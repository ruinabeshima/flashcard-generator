import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ResumeUpload from "../../components/resumes/ResumeUpload";
import Navbar from "../../components/navbar/Navbar";
import ApplicationForm from "../../components/applications/ApplicationForm";

export default function Onboarding() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    getOnboardingStatus();
  }, [getToken, navigate]);

  const updateOnboarding = async () => {
    const appUrl = import.meta.env.VITE_SERVER_URL;
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${appUrl}/auth/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("Failed to update onboarding status");
      }

      navigate("/dashboard");
    } catch {
      setError("Failed to update onboarding status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen gap-5">
      <Navbar />

      <main className="flex flex-col items-center gap-10">
        <div className="flex justify-center items-center">
          <h1 className="text-4xl font-bold">Set up your account</h1>
        </div>

        {loading ? (
          <button className="btn btn-square">
            <span className="loading loading-spinner"></span>
          </button>
        ) : error ? (
          <div role="alert" className="alert alert-error mb-10 w-4/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        ) : page === 1 ? (
          <ResumeUpload isOnboarding={true} onSuccess={() => setPage(2)} />
        ) : (
          <ApplicationForm isOnboarding={true} onSkip={updateOnboarding} />
        )}
      </main>
    </div>
  );
}
