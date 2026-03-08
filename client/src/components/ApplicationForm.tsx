import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

type ApplicationFormProps = {
  isOnboarding?: boolean;
  onSkip?: () => void;
};

export default function ApplicationForm(props: ApplicationFormProps) {
  const { getToken } = useAuth();
  const navigate = useNavigate();

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
    const token = await getToken();
    const appUrl = import.meta.env.VITE_SERVER_URL;

    setLoading(true);

    try {
      const response = await fetch(`${appUrl}/applications/add`, {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create item");
      }

      navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError("An unknown error occured");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-border bg-base-100 w-140">
      <div className="card-body">
        {props.isOnboarding ? (
          <h2 className="card-title">2. Add an Application (Optional)</h2>
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
              <option>Interviewing</option>
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

          <p>{error}</p>
        </form>
      </div>
    </div>
  );
}
