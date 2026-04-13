import { Link } from "react-router-dom";
import ApplicationCard from "./ApplicationCard";
import useApplicationsList from "../../hooks/useApplicationsList";

export default function ApplicationList() {
  const { applications, error } = useApplicationsList();

  const statusCounts = applications.reduce(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const totalApplications = applications!.length;
  const appliedCount = statusCounts.APPLIED ?? 0;
  const interviewCount = statusCounts.INTERVIEW ?? 0;
  const offerCount = statusCounts.OFFER ?? 0;
  const hasFewApplications = totalApplications > 0 && totalApplications < 3;

  return (
    <section className="px-4 sm:px-8 py-6 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/50">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold">Your application hub</h1>
            <p className="text-sm text-base-content/60">
              Track your progress, keep your resume fresh, and follow up with
              confidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/applications/add" className="btn btn-primary btn-sm">
              Add application
            </Link>
            <Link to="/your-resume" className="btn btn-ghost btn-sm">
              Update resume
            </Link>
            <Link to="/tailored" className="btn btn-ghost btn-sm">
              Tailored resumes
            </Link>
          </div>
        </header>

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
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Total applications
                </p>
                <p className="text-2xl font-semibold">{totalApplications}</p>
                <p className="text-xs text-base-content/60">
                  Keep every role in one place.
                </p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Applied
                </p>
                <p className="text-2xl font-semibold">{appliedCount}</p>
                <p className="text-xs text-base-content/60">
                  Follow up after a few days.
                </p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-base-content/50">
                  Interviews and offers
                </p>
                <p className="text-2xl font-semibold">
                  {interviewCount + offerCount}
                </p>
                <p className="text-xs text-base-content/60">
                  Momentum is building.
                </p>
              </div>
            </div>

            {totalApplications === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
                <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold">No applications yet</h2>
                  <p className="text-sm text-base-content/60">
                    Start tracking roles so you can follow up on time and keep
                    interviews organized.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/applications/add"
                      className="btn btn-primary btn-sm"
                    >
                      Add your first application
                    </Link>
                    <Link to="/your-resume" className="btn btn-ghost btn-sm">
                      Upload your resume
                    </Link>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 text-sm text-base-content/70">
                    <div className="flex items-start gap-3">
                      <span className="badge badge-ghost">1</span>
                      <p>Add a role you just applied to.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="badge badge-ghost">2</span>
                      <p>Save notes and the job link for quick reference.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="badge badge-ghost">3</span>
                      <p>Create a tailored resume from the same page.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-base-300 bg-linear-to-br from-base-100 via-base-100 to-base-200 p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-base-content/50">
                    Next up
                  </p>
                  <h3 className="text-lg font-semibold mt-2">
                    Build your first tailored resume
                  </h3>
                  <p className="text-sm text-base-content/60 mt-2">
                    Once you add an application, generate a tailored resume to
                    match the role.
                  </p>
                  <Link to="/tailored" className="btn btn-ghost btn-sm mt-4">
                    See tailored resumes
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent applications</h2>
                  <span className="text-xs text-base-content/50">
                    {totalApplications} total
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {applications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      id={application.id}
                      role={application.role}
                      company={application.company}
                      status={application.status}
                      appliedDate={application.appliedDate}
                      notes={application.notes}
                      jobUrl={application.jobUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasFewApplications && (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Keep the momentum</p>
                  <p className="text-xs text-base-content/60">
                    Add another role or generate a tailored resume to stay
                    ahead.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/applications/add"
                    className="btn btn-primary btn-sm"
                  >
                    Add another application
                  </Link>
                  <Link to="/tailored" className="btn btn-ghost btn-sm">
                    Build a tailored resume
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
