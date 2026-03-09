import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

type ApplicationFormProps = {
  isOnboarding?: boolean;
  isEdit?: boolean;
  id?: string;
  role?: string;
  company?: string;
  status?: string;
  appliedDate?: string;
  notes?: string | null;
  jobUrl?: string | null;
  onSkip?: () => void;
};

export default function ApplicationForm(props: ApplicationFormProps) {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEditApplication = () => {
      if (!props.isEdit) return;

      setRole(props.role ?? "");
      setCompany(props.company ?? "");
      setStatus(props.status ?? "APPLIED");
      setAppliedDate(props.appliedDate ?? "");
      setNotes(props.notes ?? "");
      setLink(props.jobUrl ?? "");
    };

    handleEditApplication();
  }, [
    props.isEdit,
    props.role,
    props.company,
    props.status,
    props.appliedDate,
    props.notes,
    props.jobUrl,
  ]);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("Applied");
  const [appliedDate, setAppliedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (props.isEdit) {
      await handleEditSubmit();
    } else {
      await handleAddSubmit();
    }
  };

  const handleAddSubmit = async () => {
    const token = await getToken();
    const appUrl = import.meta.env.VITE_SERVER_URL;

    setLoading(true);

    try {
      const addResponse = await fetch(`${appUrl}/applications/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: role,
          company: company,
          status: status.toUpperCase(),
          appliedDate: appliedDate || null,
          notes: notes || null,
          jobUrl: link || null,
        }),
      });

      if (!addResponse.ok) {
        setError("Failed to create item");
        return;
      }

      const statusResponse = await fetch(`${appUrl}/auth/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statusResponse.ok) {
        setError("Failed to retreive onboarding data");
        return;
      }

      const { onboardingComplete } = await statusResponse.json();
      if (onboardingComplete) {
        navigate("/dashboard");
      } else {
        const updateStatusResponse = await fetch(`${appUrl}/auth/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!updateStatusResponse.ok) {
          setError("Failed to update onboarding status");
        }
      }

      navigate("/dashboard");
    } catch {
      setError("Error: Could not create application");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    const token = await getToken();
    const appUrl = import.meta.env.VITE_SERVER_URL;

    setLoading(true);

    try {
      const response = await fetch(`${appUrl}/applications/${props.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: role,
          company: company,
          status: status.toUpperCase(),
          appliedDate: appliedDate || null,
          notes: notes || null,
          jobUrl: link || null,
        }),
      });

      if (!response.ok) {
        setError("Failed to edit application");
        return;
      }

      navigate(`/applications/${props.id}`);
    } catch {
      setError("Error: Could not edit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-border bg-base-100 w-140">
      <div className="card-body">
        {props.isOnboarding ? (
          <h2 className="card-title">2. Add an Application (Optional)</h2>
        ) : props.isEdit ? (
          <h2 className="card-title">Update Application</h2>
        ) : (
          <h2 className="card-title">Add an Application</h2>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Role</legend>
            <input
              required
              type="text"
              className="input w-full"
              placeholder="e.g. Sales Assistant"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
              }}
            />
            <p className="label">Required</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Company</legend>
            <input
              required
              type="text"
              className="input w-full"
              placeholder="e.g. Acme Company Inc"
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
              }}
            />
            <p className="label">Required</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Application Status</legend>
            <select
              className="select w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Rejected</option>
            </select>
            <p className="label">Required</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Application Date</legend>
            <input
              type="datetime-local"
              className="input w-full"
              value={appliedDate}
              onChange={(event) => {
                setAppliedDate(event.target.value);
              }}
            />
            <p className="label">Optional</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Extra Notes</legend>
            <textarea
              className="textarea h-24 w-full"
              placeholder="e.g. On-site, Internship"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
            ></textarea>
            <div className="label">Optional</div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Job Link</legend>
            <label className="input validator w-full">
              <svg
                className="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </g>
              </svg>
              <input
                type="url"
                placeholder="https://"
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                }}
                pattern="^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9\-].*[a-zA-Z0-9])?\.)+[a-zA-Z].*$"
                title="Must be valid URL"
              />
            </label>
            <p className="label">Optional</p>
            <p className="validator-hint">Must be valid URL</p>
          </fieldset>

          {props.isOnboarding ? (
            <section className="flex gap-2">
              <button className="btn btn-neutral" onClick={props.onSkip}>
                Skip
              </button>
              <button className="btn btn-primary" type="submit">
                Save
              </button>
            </section>
          ) : (
            <button
              className={`btn ${loading ? "btn-disabled" : "btn-primary"} w-full`}
              type="submit"
            >
              {loading ? "Loading..." : "Save Application"}
            </button>
          )}

          {error && (
            <div role="alert" className="alert alert-error mb-10">
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
        </form>
      </div>
    </div>
  );
}
