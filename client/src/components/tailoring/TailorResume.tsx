import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { TrackResumeSuggestions } from "../resumes/ResumeSuggestions";
import useTailoredStatus from "../../lib/useTailoredStatus";

type TailorResumeProps = {
  applicationId: string;
  onTailoringLoadingChange?: (loading: boolean) => void;
};

export default function TailorResume(props: TailorResumeProps) {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [tailoringError, setTailoringError] = useState(false);

  const {
    loading: statusLoading,
    error: statusError,
    status,
    suggestions,
    sessionId,
    tailoredResumeId,
    refetch,
  } = useTailoredStatus(props.applicationId);

  const handleTailorApplication = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    setTailoringLoading(true);
    setTailoringError(false);
    props.onTailoringLoadingChange?.(true);

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
        setTailoringError(true);
        props.onTailoringLoadingChange?.(false);
        return;
      }

      // Success - tailoring initiated
      await refetch();
      props.onTailoringLoadingChange?.(false);
    } catch {
      setTailoringError(true);
      props.onTailoringLoadingChange?.(false);
    } finally {
      setTailoringLoading(false);
    }
  };

  const loading = tailoringLoading || statusLoading;
  const error = tailoringError || statusError;

  return (
    <section className="w-full">
      {loading ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="loading loading-spinner loading-md"></span>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
                  Tailoring
                </p>
                <h3 className="text-lg font-semibold">
                  Preparing tailored suggestions
                </h3>
              </div>
            </div>
            <div className="skeleton h-3 w-3/4"></div>
            <div className="skeleton h-3 w-1/2"></div>
          </div>
        </div>
      ) : error ? (
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
          <span>An error occurred while tailoring this resume.</span>
        </div>
      ) : status === "PENDING" || status === "REVIEWED" ? (
        <TrackResumeSuggestions
          sessionId={sessionId!}
          suggestions={suggestions!}
          onTailoringLoadingChange={props.onTailoringLoadingChange}
        />
      ) : status === "TAILORED" ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="badge badge-success">Tailored</div>
            <div>
              <h3 className="text-lg font-semibold">Resume tailored</h3>
              <p className="text-sm text-base-content/60">
                Your customized resume is ready to download.
              </p>
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={() =>
                window.open(
                  `${appUrl}/resumes/tailored/${tailoredResumeId}`,
                  "_blank",
                )
              }
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z" />
              </svg>
              Download Resume
            </button>
          </div>
        </div>
      ) : status === "NONE" ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="badge badge-ghost">AI Tailoring</div>
            <div>
              <h3 className="text-lg font-semibold">Tailor this resume</h3>
              <p className="text-sm text-base-content/60">
                Get focused feedback and a tailored version for this role.
              </p>
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={handleTailorApplication}
              disabled={tailoringLoading}
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
          </div>
        </div>
      ) : null}
    </section>
  );
}
