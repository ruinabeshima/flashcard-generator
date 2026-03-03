import NavBar from "./navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

interface Application {
  id: string;
  role: string;
  company: string;
  status: string;
  appliedDate: string;
  notes: string | null;
  jobUrl: string | null;
}

export default function Dashboard() {
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
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to retrieve applications",
          );
        }

        const data: Application[] = await response.json();
        console.log(data);
        setApplications(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occured");
        }
      }
    };

    getApplications();
  }, [getToken]);

  return (
    <div className="flex min-h-screen flex-col gap-5 w-full">
      <NavBar />

      <section className="px-8 py-4">
        {error && (
          <div role="alert" className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-3 text-base-content/50">
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
                >
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="card-title text-lg">
                          {application.role}
                        </h2>
                        <p className="text-base-content/70 font-medium">
                          {application.company}
                        </p>
                      </div>
                      <div
                        className={`badge badge-soft ${
                          application.status === "Applied"
                            ? "badge-info"
                            : application.status === "Interview"
                              ? "badge-warning"
                              : application.status === "Offer"
                                ? "badge-success"
                                : application.status === "Rejected"
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
                          {new Date(
                            application.appliedDate,
                          ).toLocaleDateString()}
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
    </div>
  );
}
