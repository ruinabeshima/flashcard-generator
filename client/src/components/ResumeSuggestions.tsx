import { useState } from "react";

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
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const hideSuggestion = (key: string) => {
    setHidden((prev) => new Set(prev).add(key));
  };

  const handleAcceptSuggestion = (
    key: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    hideSuggestion(key);
  };

  const handleRejectSuggestion = (
    key: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    hideSuggestion(key);
  };

  return (
    <div className="flex flex-col gap-5 m-10">
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

      {props.suggestions.improve.map((suggestion, i) =>
        hidden.has(`improve-${i}`) ? null : (
          <div className="card bg-success w-96 shadow-sm" key={`improve-${i}`}>
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
                  onClick={(event) => handleAcceptSuggestion(`add-${i}`, event)}
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
                  onClick={(event) => handleRejectSuggestion(`add-${i}`, event)}
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
    </div>
  );
}
