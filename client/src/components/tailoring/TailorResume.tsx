import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { TrackResumeSuggestions } from "../resumes/ResumeSuggestions";
import type { TypeResumeSuggestions } from "../resumes/ResumeSuggestions";

type Suggestion = {
  sessionId: string;
  suggestions: TypeResumeSuggestions;
};

type TailorResumeProps = {
  applicationId: string;
};

export default function TailorResume(props: TailorResumeProps) {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestion | null>(null);
  const [getSuggestions, setGetSuggestions] = useState(false);
  const [error, setError] = useState(false);

  const handleTailorApplication = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${appUrl}/feedback/${props.applicationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      if (data.status === "PENDING") {
        setData(data);
        setGetSuggestions(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading || !data ? (
        <span className="loading loading-spinner loading-md"></span>
      ) : error ? (
        <p>An error occurred</p>
      ) : getSuggestions ? (
        <TrackResumeSuggestions
          sessionId={data.sessionId!}
          suggestions={data.suggestions!}
        />
      ) : (
        <section className="w-full flex justify-center items-center">
          <button
            className="btn btn-primary gap-2"
            onClick={handleTailorApplication}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Tailor Resume
          </button>
        </section>
      )}
    </>
  );
}
