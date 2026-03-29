import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ResumeUpload from "../../components/resumes/ResumeUpload";

export default function UserResume() {
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const appUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const getResumeLink = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/resumes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError("Failed to retrieve resume");
          return;
        }

        const { url } = await response.json();
        setUrl(url);
        console.log(url);
      } catch {
        setError("Failed to retreive resume");
      } finally {
        setLoading(false);
      }
    };

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
    getResumeLink();
  }, [getToken, appUrl, navigate]);

  return (
    <div className="w-full min-h-screen flex flex-col gap-7 items-center">
      <Navbar />
      {error ? (
        <div role="alert" className="alert alert-error w-4/5">
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
      ) : loading ? (
        <button className="btn btn-square">
          <span className="loading loading-spinner"></span>
        </button>
      ) : (
        <>
          <iframe src={url} className="w-4/5 h-screen" />
          <ResumeUpload isUpdate={true} />
        </>
      )}
    </div>
  );
}
