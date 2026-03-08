import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

type ResumeUploadProps = {
  isOnboarding?: boolean;
  isUpdate?: boolean;
  onSuccess?: () => void;
};

export default function ResumeUpload(props: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<null | string>();
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const uploadFile = async (event: React.FormEvent) => {
    event.preventDefault();
    const appUrl = import.meta.env.VITE_SERVER_URL;

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file!);

      const response = await fetch(`${appUrl}/resumes/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      props.onSuccess?.();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occured");
      }
    } finally {
      setLoading(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile && selectedFile.type !== "application/pdf") {
      return;
    }
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  return (
    <section className="w-full p-5 flex flex-col justify-center items-center">
      <form
        className="w-2/5 flex flex-col gap-5 border border-dashed p-5 rounded-xl"
        onSubmit={uploadFile}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          {props.isOnboarding ? (
            <h2 className="text-2xl font-bold">1. Upload Your Resume</h2>
          ) : props.isUpdate ? (
            <h2 className="text-2xl font-bold">Update Your Resume</h2>
          ) : (
            <h2 className="text-2xl font-bold">Upload Your Resume</h2>
          )}
          <p className="text-sm text-gray-500">Supported formats: PDF Only</p>
        </div>

        {!file ? (
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-40 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium rounded-xl"
            >
              <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm font-semibold">
                  Drag & drop your resume here
                </p>
                <p className="text-xs">or click to browse</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                PDF
              </div>
              <div>
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleFileRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <button
          className={`btn ${loading ? "btn-disabled" : "btn-primary"}`}
          disabled={!file}
          type="submit"
        >
          {loading ? "Loading..." : "Upload Resume"}
        </button>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </form>
    </section>
  );
}
