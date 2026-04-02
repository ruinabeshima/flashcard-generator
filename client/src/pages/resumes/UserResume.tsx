import Navbar from "../../components/navbar/Navbar";
import ResumeUpload from "../../components/resumes/ResumeUpload";
import useOnboardingStatus from "../../lib/useOnboardingStatus";
import useResumeLink from "../../lib/useResumeLink";

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
    <div className="w-full min-h-screen flex flex-col gap-7 items-center">
      <Navbar />
      {error ? (
        <div role="alert" className="alert alert-error w-4/5">
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
        <button className="btn btn-square">
          <span className="loading loading-spinner"></span>
        </button>
      ) : (
        <>
          <iframe src={url} className="w-4/5 h-screen" />
          <ResumeUpload isUpdate={true} />
        </>
      )}
    </div>
  );
}
