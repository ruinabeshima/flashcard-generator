import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ApplicationForm from "../../components/applications/ApplicationForm";
import useIndividualApplication from "../../lib/useIndividualApplication";
import useOnboardingStatus from "../../lib/useOnboardingStatus";

export default function EditApplication() {
  const { id } = useParams<{ id: string }>();
  const {
    application,
    loading: appLoading,
    error: appError,
  } = useIndividualApplication(id!);
  const { loading: onboardingLoading, error: onboardingError } =
    useOnboardingStatus();

  const loading = appLoading || onboardingLoading;
  const error = appError || onboardingError;

  return (
    <div className="flex flex-col gap-5 min-h-screen w-full items-center">
      <Navbar />

      {loading ? (
        <button className="btn btn-square">
          <span className="loading loading-spinner"></span>
        </button>
      ) : error ? (
        <div role="alert" className="alert alert-error mb-10 w-4/5">
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
      ) : !application ? (
        <div role="alert" className="alert alert-error mb-10 w-4/5">
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
          <span>Application does not exist</span>
        </div>
      ) : (
        <section className="relative flex justify-center w-full px-8 py-4">
          <Link to={`/applications/${id}`} className="absolute left-8 top-0">
            <button className="btn">← Back</button>
          </Link>
          <ApplicationForm
            isEdit={true}
            id={id}
            role={application.role}
            company={application.company}
            status={application.status}
            appliedDate={application.appliedDate}
            notes={application.notes}
            jobUrl={application.jobUrl}
          />
        </section>
      )}
    </div>
  );
}
