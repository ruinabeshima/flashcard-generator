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
    <div className="w-full min-h-screen flex flex-col gap-5">
      <Navbar />

      <main className="flex flex-col items-center">
        {error ? (
          <h1>An error occurred</h1>
        ) : loading ? (
          <span className="loading loading-spinner loading-xl"></span>
        ) : (
          url && <iframe src={url} className="w-4/5 h-screen" />
        )}
      </main>
    </div>
  );
}
