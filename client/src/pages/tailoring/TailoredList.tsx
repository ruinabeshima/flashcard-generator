import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import useTailoredResumes from "../../hooks/useTailoredResumes";
import useOnboardingStatus from "../../hooks/useOnboardingStatus";

export default function TailoredList() {
  const { loading: onboardingLoading, error: onboardingError } =
    useOnboardingStatus();
  const {
    data,
    loading: tailoredLoading,
    error: tailoredError,
  } = useTailoredResumes();

  const loading = onboardingLoading || tailoredLoading;
  const error = onboardingError || tailoredError;

  return (
    <div className="w-full min-h-screen flex flex-col gap-5 bg-base-200/40">
      <Navbar />

      <main className="flex flex-col items-center gap-8 px-4 pb-16">
        <header className="w-full max-w-5xl flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
            Tailored Resumes
          </p>
          <h1 className="text-3xl font-bold">Your tailored versions</h1>
          <p className="text-sm text-base-content/60">
            Open a version to review, export, or share with recruiters.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading tailored resumes...</span>
          </div>
        ) : error ? (
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
            <span>An error occured.</span>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full max-w-5xl rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-sm text-base-content/60">
            No tailored resumes found yet.
          </div>
        ) : (
          <ul className="w-full max-w-5xl flex flex-col gap-3">
            {data.map((resume) => (
              <Link
                key={resume.id}
                to={`/applications/${resume.applicationId}/tailored/${resume.id}`}
                className="group"
              >
                <li className="flex items-center justify-between gap-4 p-4 rounded-xl border border-base-300 bg-base-100 shadow-sm transition-shadow group-hover:shadow-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{resume.name}</span>
                    <span className="text-sm text-base-content/50">
                      {new Date(resume.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="btn btn-ghost btn-sm">Open</span>
                </li>
              </Link>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
