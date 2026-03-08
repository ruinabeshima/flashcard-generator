import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import ResumeUpload from "../components/ResumeUpload";

export default function UserResume() {
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const { getToken } = useAuth();

  useEffect(() => {
    const getResumeLink = async () => {
      const appUrl = import.meta.env.VITE_SERVER_URL;

      try {
        const token = await getToken();
        const response = await fetch(`${appUrl}/resumes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to retrieve resume link",
          );
        }

        const { url } = await response.json();
        setUrl(url);
        console.log(url);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occured");
        }
      } finally {
        setLoading(false);
      }
    };

    getResumeLink();
  }, [getToken]);

  return (
    <div className="w-full min-h-screen flex flex-col gap-7 items-center">
      <Navbar />
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
      ) : loading ? (
        <div className="w-full flex items-center justify-center">
          <h1 className="text-5xl font-bold">Loading ... </h1>
        </div>
      ) : (
        <>
          <iframe src={url} className="w-4/5 h-screen" />
          <ResumeUpload />
        </>
      )}
    </div>
  );
}
