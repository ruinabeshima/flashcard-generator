import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import TailorResume from "../../components/tailoring/TailorResume";
import useOnboardingStatus from "../../hooks/useOnboardingStatus";
import useIndividualApplication from "../../hooks/useIndividualApplication";

export default function ApplicationDetail() {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<null | string>(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);

  const { loading: onboardingLoading, error: onboardingError } =
    useOnboardingStatus();
  const {
    application,
    loading: appLoading,
    error: appError,
  } = useIndividualApplication(id!);

  const handleApplicationDelete = async () => {
    setDeleteLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${appUrl}/applications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setDeleteError("Failed to delete application");
        return;
      }

      navigate("/dashboard");
    } catch {
      setDeleteError("Failed to delete application");
    } finally {
      setDeleteLoading(false);
    }
  };

  const loading = onboardingLoading || appLoading || deleteLoading;
  const error = onboardingError || appError || deleteError;

  return (
    <div className="w-full min-h-screen flex flex-col gap-5 bg-base-200/40">
      <Navbar />

      <main className="flex flex-col items-center gap-8 px-4 pb-16">
        <header className="w-full max-w-5xl flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
            Application
          </p>
          <h1 className="text-3xl font-bold">Your application details</h1>
          <p className="text-sm text-base-content/60">
            Review the status, notes, and tailor your resume when ready.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading application...</span>
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error w-full max-w-5xl">
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
          <div role="alert" className="alert alert-error w-full max-w-5xl">
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
          <section className="w-full max-w-5xl flex flex-col gap-6">
            <div
              key={application.id}
              className="card bg-base-100 shadow-sm border border-base-200"
            >
              <div className="card-body gap-4">
                <div className="flex items-start justify-between gap-3">
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

                <div className="grid gap-3 text-sm text-base-content/70">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-ghost">Applied</span>
                    <span className="text-base-content font-medium">
                      {new Date(application.appliedDate).toLocaleDateString()}
                    </span>
                  </div>
                  {application.notes && (
                    <div className="flex items-start gap-2">
                      <span className="badge badge-ghost">Notes</span>
                      <span className="text-base-content">
                        {application.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {application.jobUrl ? (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost"
                    >
                      View job posting
                    </a>
                  ) : (
                    <span className="text-xs text-base-content/50">
                      No job link added yet.
                    </span>
                  )}
                </div>

                <div className="card-actions justify-end">
                  <button
                    className="btn btn-outline btn-accent"
                    onClick={() => navigate(`/applications/${id}/edit`)}
                    disabled={tailoringLoading}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={handleApplicationDelete}
                    disabled={tailoringLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold">Tailor your resume</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Generate targeted feedback and a tailored version for this role.
              </p>
              <TailorResume
                applicationId={id ?? ""}
                onTailoringLoadingChange={setTailoringLoading}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
