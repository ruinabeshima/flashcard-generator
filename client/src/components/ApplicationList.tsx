import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

interface Application {
  id: string;
  role: string;
  company: string;
  status: string;
  appliedDate: string;
  notes: string | null;
  jobUrl: string | null;
}

export default function ApplicationList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const { getToken } = useAuth();

  useEffect(() => {
    const appUrl = import.meta.env.VITE_SERVER_URL;

    const getApplications = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/applications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to retrieve applications");
        }

        const data: Application[] = await response.json();
        console.log(data);
        setApplications(data);
      } catch (error: unknown) {
        setError("Failed to retrieve applications");
      }
    };

    getApplications();
  }, [getToken]);

  return (
    <section className="px-8 py-4 flex flex-col items-center">
      {error && (
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
      )}

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-base-content/50">
          <p className="text-xl font-semibold">No applications yet</p>
          <p className="text-sm">Start tracking your job applications!</p>
          <Link to="/applications/add">
            <button className="btn btn-neutral btn-dash">Click Me</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Link to="/applications/add">
              <button className="btn btn-neutral btn-dash">
                Add an Application
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/applications/${application.id}`)}
              >
                <div className="card-body gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="card-title text-lg wrap-break-word">{application.role}</h2>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
