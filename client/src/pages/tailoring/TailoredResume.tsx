import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";

export default function TailoredResume() {
  const appUrl = import.meta.env.VITE_SERVER_URL;
  const { getToken } = useAuth();
  const [url, setUrl] = useState<null | string>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { tailoredResumeId } = useParams();

  useEffect(() => {
    const getTailoredResumeURL = async () => {
      setLoading(true);

      try {
        if (!tailoredResumeId) {
          setError(true);
          return;
        }

        const token = await getToken();
        const response = await fetch(
          `${appUrl}/resumes/tailored/${tailoredResumeId}`,
          {
            method: "GET",
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
        setUrl(data.url);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    getTailoredResumeURL();
  }, [getToken, appUrl, tailoredResumeId]);

  return (
    <div className="w-full min-h-screen flex flex-col gap-5 bg-base-200/40">
      <Navbar />

      <main className="flex flex-col items-center gap-8 px-4 pb-16">
        <header className="w-full max-w-5xl flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-base-content/50">
            Tailored Resume
          </p>
          <h1 className="text-3xl font-bold">Your customized version</h1>
          <p className="text-sm text-base-content/60">
            Review this version before sending it out or sharing it with a
            recruiter.
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
            <span>We couldn't load this tailored resume.</span>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading tailored resume...</span>
          </div>
        ) : (
          url && (
            <section className="w-full max-w-5xl flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Resume preview</h2>
                  <p className="text-xs text-base-content/60">
                    Export or open this version in a new tab.
                  </p>
                </div>
                <a
                  className="btn btn-ghost btn-sm"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in new tab
                </a>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                <iframe
                  src={url}
                  title="Tailored resume preview"
                  className="w-full h-[75vh]"
                />
              </div>
            </section>
          )
        )}
      </main>
    </div>
  );
}
