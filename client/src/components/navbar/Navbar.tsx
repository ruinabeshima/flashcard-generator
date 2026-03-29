import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="w-full flex justify-between py-5 px-7">
      <section className="flex justify-center items-center">
        <Link to="/dashboard">
          <h1 className="text-4xl font-bold">ApplyWise</h1>
        </Link>
      </section>

      {isSignedIn ? (
        <div className="flex gap-7">
          <Link to="/your-resume" className="flex justify-center items-center">
            <button className="btn btn-active btn-secondary">
              Your Resume
            </button>
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "!w-12 !h-12",
              },
            }}
          />
        </div>
      ) : (
        <div className="flex gap-5">
          <Link to="/register" className="flex justify-center items-center">
            <button className="btn btn-active btn-primary">Get started</button>
          </Link>
          <Link to="/login" className="flex justify-center items-center">
            <button className="btn btn-active btn-primary">Login</button>
          </Link>
        </div>
      )}
    </nav>
  );
}
