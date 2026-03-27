import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

export type TypeResumeSuggestions = {
  miss: string[];
  improve: string[];
  add: string[];
  weak: string[];
};

export type ResumeSuggestionsProps = {
  sessionId: string;
  suggestions: TypeResumeSuggestions;
};

const SuggestionTypes = {
  miss: "MISS",
  improve: "IMPROVE",
  add: "ADD",
  weak: "WEAK",
} as const;

type SuggestionTypes = (typeof SuggestionTypes)[keyof typeof SuggestionTypes];

export function TrackResumeSuggestions(props: ResumeSuggestionsProps) {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>(
    [],
  );

  const total =
    props.suggestions.miss.length +
    props.suggestions.improve.length +
    props.suggestions.add.length +
    props.suggestions.weak.length;
  const remaining = total - hidden.size;

  useEffect(() => {
    if (submitted || loading || error) return;
    if (total === 0) return;
    if (remaining !== 0) return;

    const submitSuggestions = async () => {
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
          return;
        }

        setSubmitted(true);
        const data = await response.json();
        console.log(data.message, data.status);
      } catch {
        setError(true);
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
    appUrl,
    getToken,
    props.sessionId,
  ]);

  const handleAcceptSuggestion = (
    key: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

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

    setHidden((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setDismissedSuggestions((prev) => [...prev, key]);
  };

  return (
    <div className="flex flex-col gap-5 m-10">
      {error ? (
        <h1>An error occured</h1>
      ) : loading ? (
        <span className="loading loading-spinner loading-xl"></span>
      ) : (
        <>
          {/* Missed */}
          {props.suggestions.miss.map((suggestion, i) =>
            hidden.has(`miss-${i}`) ? null : (
              <div
                className="card bg-error w-96 shadow-sm border border-red-500"
                key={`miss-${i}`}
              >
                <div className="card-body">
                  <h2 className="card-title">Miss</h2>
                  <p>{suggestion}</p>
                  <div className="card-actions mt-4 justify-start gap-3">
                    <button
                      className="btn btn-circle btn-sm bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      aria-label="Accept suggestion"
                      onClick={(event) =>
                        handleAcceptSuggestion(`miss-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13L9 17L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className="btn btn-circle btn-sm bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      aria-label="Deny suggestion"
                      onClick={(event) =>
                        handleRejectSuggestion(`miss-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 6L18 18M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
          {/* Improve */}
          {props.suggestions.improve.map((suggestion, i) =>
            hidden.has(`improve-${i}`) ? null : (
              <div
                className="card bg-success w-96 shadow-sm"
                key={`improve-${i}`}
              >
                <div className="card-body">
                  <h2 className="card-title">Improve</h2>
                  <p>{suggestion}</p>
                  <div className="card-actions mt-4 justify-start gap-3">
                    <button
                      className="btn btn-circle btn-sm bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      aria-label="Accept suggestion"
                      onClick={(event) =>
                        handleAcceptSuggestion(`improve-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13L9 17L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className="btn btn-circle btn-sm bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      aria-label="Deny suggestion"
                      onClick={(event) =>
                        handleRejectSuggestion(`improve-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 6L18 18M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
          {/* Add */}
          {props.suggestions.add.map((suggestion, i) =>
            hidden.has(`add-${i}`) ? null : (
              <div className="card bg-info w-96 shadow-sm" key={`add-${i}`}>
                <div className="card-body">
                  <h2 className="card-title">Add</h2>
                  <p>{suggestion}</p>
                  <div className="card-actions mt-4 justify-start gap-3">
                    <button
                      className="btn btn-circle btn-sm bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      aria-label="Accept suggestion"
                      onClick={(event) =>
                        handleAcceptSuggestion(`add-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13L9 17L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className="btn btn-circle btn-sm bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      aria-label="Deny suggestion"
                      onClick={(event) =>
                        handleRejectSuggestion(`add-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 6L18 18M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
          {/* Weak */}
          {props.suggestions.weak.map((suggestion, i) =>
            hidden.has(`weak-${i}`) ? null : (
              <div className="card bg-warning w-96 shadow-sm" key={`weak-${i}`}>
                <div className="card-body">
                  <h2 className="card-title">Weak</h2>
                  <p>{suggestion}</p>
                  <div className="card-actions mt-4 justify-start gap-3">
                    <button
                      className="btn btn-circle btn-sm bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      aria-label="Accept suggestion"
                      onClick={(event) =>
                        handleAcceptSuggestion(`weak-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13L9 17L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className="btn btn-circle btn-sm bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      aria-label="Deny suggestion"
                      onClick={(event) =>
                        handleRejectSuggestion(`weak-${i}`, event)
                      }
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 6L18 18M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </>
      )}
    </div>
  );
}
