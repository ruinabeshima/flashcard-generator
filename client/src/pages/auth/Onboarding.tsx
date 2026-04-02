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
  const [loadingMessage, setLoadingMessage] = useState(
    "Checking your onboarding status...",
  );
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const stepDetails =
    page === 1
      ? {
          label: "Step 1 of 2",
          description:
            "Upload a resume to personalize your experience and tailor recommendations.",
        }
      : {
          label: "Step 2 of 2",
          description:
            "Add your first application or skip for now to head to your dashboard.",
        };

  useEffect(() => {
    const appUrl = import.meta.env.VITE_SERVER_URL;

    const getOnboardingStatus = async () => {
      setLoadingMessage("Checking your onboarding status...");
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
    setLoadingMessage("Skipping for now and finishing setup...");
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

        <section className="w-full max-w-3xl flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
            <span
              className={
                page === 1 ? "text-primary font-semibold" : "text-gray-400"
              }
            >
              Resume
            </span>
            <span
              className={
                page === 2 ? "text-primary font-semibold" : "text-gray-400"
              }
            >
              Application
            </span>
          </div>
          <div className="w-full flex items-center gap-2">
            <div
              className={`h-2 flex-1 rounded-full ${
                page >= 1 ? "bg-primary" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`h-2 flex-1 rounded-full ${
                page >= 2 ? "bg-primary" : "bg-gray-200"
              }`}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              {stepDetails.label}.
            </span>{" "}
            {stepDetails.description}
          </p>
        </section>

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
            <span className="loading loading-spinner loading-md"></span>
            <span>{loadingMessage}</span>
          </div>
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
