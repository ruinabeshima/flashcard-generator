import NavBar from "@/components/navbar";
import FileUpload from "@/components/file-upload";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-4">
        <FileUpload />
      </main>
    </div>
  );
}
