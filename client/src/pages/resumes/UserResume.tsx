import Navbar from "../../components/navbar/Navbar";
import ResumeUpload from "../../components/resumes/ResumeUpload";
import useOnboardingStatus from "../../hooks/useOnboardingStatus";
import useResumeLink from "../../hooks/useResumeLink";

export default function UserResume() {
  const {
    url,
    loading: resumeLinkLoading,
    error: resumeLinkError,
  } = useResumeLink();
  const { loading: onboardingLoading, error: onboardingError } =
    useOnboardingStatus();

  const loading = resumeLinkLoading || onboardingLoading;
  const error = resumeLinkError || onboardingError;

  return (
    <div className="w-full min-h-screen flex flex-col gap-7 items-center bg-base-200/40">
      <Navbar />
      <main className="w-full flex flex-col items-center gap-8 px-4 pb-16">
        <header className="w-full max-w-5xl flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
            Your Resume
          </p>
          <h1 className="text-3xl font-bold">Preview and keep it up to date</h1>
          <p className="text-sm text-base-content/60">
            This is the resume recruiters will see. Review it and refresh it
            anytime.
          </p>
        </header>

        {error ? (
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
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading your resume preview...</span>
          </div>
        ) : (
          <section className="w-full max-w-5xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Resume preview</h2>
                <p className="text-xs text-base-content/60">
                  Make sure everything looks sharp before you apply.
                </p>
              </div>
              {url && (
                <a
                  className="btn btn-ghost btn-sm"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in new tab
                </a>
              )}
            </div>
            <div className="relative rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
              {url && (
                <iframe
                  src={url}
                  title="Resume preview"
                  className="w-full h-[75vh]"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
                <span className="rounded-full bg-base-100/90 px-3 py-1 text-xs text-base-content/60 shadow-sm">
                  Scroll down to update your resume
                </span>
              </div>
            </div>
          </section>
        )}

        {!error && !loading && <ResumeUpload isUpdate={true} />}
      </main>
    </div>
  );
}
