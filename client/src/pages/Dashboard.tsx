import ApplicationList from "../components/applications/ApplicationList";
import Navbar from "../components/navbar/Navbar";
import useOnboardingStatus from "../lib/useOnboardingStatus";

export default function Dashboard() {
  const { loading, error } = useOnboardingStatus();

  return (
    <div className="flex min-h-screen flex-col gap-5 w-full items-center">
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
      ) : (
        <ApplicationList />
      )}
    </div>
  );
}
