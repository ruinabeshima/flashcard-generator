import Navbar from "../components/Navbar";
import ApplicationForm from "../components/ApplicationForm";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function AddApplication() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
        if (data.onboardingComplete != true) {
          navigate("/onboarding");
        }
      } catch {
        setError("Failed to get onboarding status");
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [getToken]);

  return (
    <div className="flex flex-col gap-10 items-center">
      <Navbar />
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
      ) : (
        <ApplicationForm />
      )}
    </div>
  );
}
