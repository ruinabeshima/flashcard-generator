import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import TailorResume from "../../components/tailoring/TailorResume";

interface Application {
  id: string;
  role: string;
  company: string;
  status: string;
  appliedDate: string;
  notes: string | null;
  jobUrl: string | null;
}

export default function ApplicationDetail() {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getIndividualApplication = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/applications/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError("Failed to retrieve application");
          return;
        }

        const data = await response.json();
        setApplication(data);
      } catch {
        setError("Failed to retrieve applications");
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
    getIndividualApplication();
  }, [getToken, id, appUrl, navigate]);

  const handleApplicationDelete = async () => {
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${appUrl}/applications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("Failed to delete application");
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("Failed to delete application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 min-h-screen w-full items-center">
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
      ) : !application ? (
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
          <span>Application does not exist</span>
        </div>
      ) : (
        <>
          <section className="flex justify-center items-center">
            <h1 className="text-3xl font-bold">Your Application</h1>
          </section>

          <div
            key={application.id}
            className="card bg-base-100 shadow-md border border-base-200 w-full max-w-2xl"
          >
            <div className="card-body gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="card-title text-lg wrap-break-word">
                    {application.role}
                  </h2>
                  <p className="text-base-content/70 font-medium truncate">
                    {application.company}
                  </p>
                </div>
                <div
                  className={`badge badge-soft shrink-0 ${
                    application.status === "APPLIED"
                      ? "badge-info"
                      : application.status === "INTERVIEW"
                        ? "badge-warning"
                        : application.status === "OFFER"
                          ? "badge-success"
                          : application.status === "REJECTED"
                            ? "badge-error"
                            : "badge-neutral"
                  }`}
                >
                  {application.status}
                </div>
              </div>

              <div className="divider my-0" />

              <div className="flex flex-col gap-1 text-sm text-base-content/70">
                <p>
                  ⏰ Applied:{" "}
                  <span className="text-base-content font-medium">
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </span>
                </p>
                {application.notes && (
                  <p>
                    📖{" "}
                    <span className="text-base-content">
                      {application.notes}
                    </span>
                  </p>
                )}
              </div>

              {application.jobUrl && (
                <div className="card-actions justify-end mt-1">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-soft btn-primary btn-sm"
                  >
                    View Job →
                  </a>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  className="btn btn-xs btn-accent"
                  onClick={() => navigate(`/applications/${id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={handleApplicationDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <TailorResume applicationId={id ?? ""} />
        </>
      )}
    </div>
  );
}
