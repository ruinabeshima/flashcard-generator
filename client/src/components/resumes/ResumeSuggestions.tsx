import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export type TypeResumeSuggestions = {
  miss: string[];
  improve: string[];
  add: string[];
  weak: string[];
};

export type ResumeSuggestionsProps = {
  sessionId: string;
  suggestions: TypeResumeSuggestions;
  onTailoringLoadingChange?: (loading: boolean) => void;
};

export function TrackResumeSuggestions(props: ResumeSuggestionsProps) {
  const navigate = useNavigate();
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>(
    [],
  );
  const [submitted, setSubmitted] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [resumeNameSnapshot, setResumeNameSnapshot] = useState<string | null>(
    null,
  );

  const total =
    props.suggestions.miss.length +
    props.suggestions.improve.length +
    props.suggestions.add.length +
    props.suggestions.weak.length;
  const remaining = total - hidden.size;
  const acceptedCount = acceptedSuggestions.length;
  const dismissedCount = dismissedSuggestions.length;
  const loadingLabel = submitted
    ? "Generating your tailored resume..."
    : "Saving your selections...";

  useEffect(() => {
    if (submitted || loading || error) return;
    if (total === 0) return;
    if (remaining !== 0) return;

    const submitSuggestions = async () => {
      const normalizedResumeName = resumeName.trim();
      setResumeNameSnapshot(
        normalizedResumeName.length > 0 ? normalizedResumeName : null,
      );
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(
          `${appUrl}/feedback/update/${props.sessionId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ acceptedSuggestions, dismissedSuggestions }),
          },
        );

        if (!response.ok) {
          setError(true);
          props.onTailoringLoadingChange?.(false);
          return;
        }

        setSubmitted(true);
      } catch {
        setError(true);
        props.onTailoringLoadingChange?.(false);
      } finally {
        setLoading(false);
      }
    };

    submitSuggestions();
  }, [
    total,
    remaining,
    submitted,
    loading,
    error,
    acceptedSuggestions,
    dismissedSuggestions,
    resumeName,
    appUrl,
    getToken,
    props,
    props.sessionId,
    props.onTailoringLoadingChange,
  ]);

  useEffect(() => {
    if (!submitted || loading || error || generated) {
      return;
    }

    const getTailoredResume = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(
          `${appUrl}/feedback/generate/${props.sessionId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resumeName: resumeNameSnapshot ?? null,
            }),
          },
        );

        if (!response.ok) {
          setError(true);
          props.onTailoringLoadingChange?.(false);
          return;
        }

        const data = await response.json();
        setGenerated(true);
        props.onTailoringLoadingChange?.(false);
        navigate(
          `/applications/${data.applicationId}/tailored/${data.tailoredResumeId}`,
        );
      } catch {
        setError(true);
        props.onTailoringLoadingChange?.(false);
      } finally {
        setLoading(false);
      }
    };

    getTailoredResume();
  }, [
    submitted,
    loading,
    error,
    navigate,
    generated,
    resumeNameSnapshot,
    appUrl,
    getToken,
    props,
    props.sessionId,
    props.onTailoringLoadingChange,
  ]);

  useEffect(() => {
    if (total !== 0) return;
    props.onTailoringLoadingChange?.(false);
  }, [total, props, props.onTailoringLoadingChange]);

  const handleAcceptSuggestion = (
    key: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    // States have to immutable
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setAcceptedSuggestions((prev) => [...prev, key]);
  };

  const handleRejectSuggestion = (
    key: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    // States have to be immutable
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setDismissedSuggestions((prev) => [...prev, key]);
  };

  const sections = [
    {
      key: "miss",
      label: "Missing",
      tone: "badge-error",
      border: "border-error/40",
      description: "Critical gaps to fill.",
      items: props.suggestions.miss,
    },
    {
      key: "improve",
      label: "Improve",
      tone: "badge-warning",
      border: "border-warning/40",
      description: "Refine clarity and impact.",
      items: props.suggestions.improve,
    },
    {
      key: "add",
      label: "Add",
      tone: "badge-info",
      border: "border-info/40",
      description: "Add relevant details.",
      items: props.suggestions.add,
    },
    {
      key: "weak",
      label: "Weak",
      tone: "badge-secondary",
      border: "border-secondary/40",
      description: "Strengthen these areas.",
      items: props.suggestions.weak,
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
                Tailored Suggestions
              </p>
              <h3 className="text-lg font-semibold">
                Review and refine your resume
              </h3>
              <p className="text-sm text-base-content/60">
                Accept or dismiss each suggestion to generate a tailored
                version.
              </p>
            </div>
            <label className="form-control w-full lg:max-w-xs">
              <div className="label">
                <span className="label-text">Tailored resume name</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g. Product Designer - Stripe"
                value={resumeName}
                maxLength={30}
                onChange={(event) => setResumeName(event.target.value)}
              />
              <div className="label">
                <span className="label-text-alt text-base-content/50">
                  Optional. Enter before finishing all suggestions.
                </span>
              </div>
            </label>
          </div>

          <div className="stats stats-vertical lg:stats-horizontal bg-base-200/40">
            <div className="stat">
              <div className="stat-title">Total</div>
              <div className="stat-value text-primary">{total}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Remaining</div>
              <div className="stat-value text-accent">{remaining}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Accepted</div>
              <div className="stat-value text-success">{acceptedCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Dismissed</div>
              <div className="stat-value text-error">{dismissedCount}</div>
            </div>
          </div>

          <progress
            className="progress progress-primary"
            value={total - remaining}
            max={Math.max(total, 1)}
          ></progress>

          {loading && (
            <div className="alert alert-info">
              <span className="loading loading-spinner loading-sm"></span>
              <span>{loadingLabel}</span>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div role="alert" className="alert alert-error">
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
          <span>Something went wrong while processing suggestions.</span>
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-sm text-base-content/60">
          No suggestions were generated for this application.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((section) =>
            section.items.length === 0 ? null : (
              <div key={section.key} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`badge ${section.tone}`}>
                    {section.label}
                  </span>
                  <span className="text-sm text-base-content/60">
                    {section.description}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {section.items.length} items
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map((suggestion, i) => {
                    const key = `${section.key}-${i}`;
                    if (hidden.has(key)) return null;

                    return (
                      <div
                        key={key}
                        className={`card bg-base-100 border ${section.border} shadow-sm transition-shadow hover:shadow-md`}
                      >
                        <div className="card-body gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-base-content">
                              {section.label}
                            </h4>
                            <span
                              className={`badge badge-outline ${section.tone}`}
                            >
                              Suggestion
                            </span>
                          </div>
                          <p className="text-sm text-base-content/70">
                            {suggestion}
                          </p>
                          <div className="card-actions justify-end gap-2">
                            <button
                              className="btn btn-sm btn-outline btn-success"
                              aria-label="Accept suggestion"
                              onClick={(event) =>
                                handleAcceptSuggestion(key, event)
                              }
                              disabled={loading || submitted}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-sm btn-outline btn-error"
                              aria-label="Dismiss suggestion"
                              onClick={(event) =>
                                handleRejectSuggestion(key, event)
                              }
                              disabled={loading || submitted}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
