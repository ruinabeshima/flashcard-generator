import { UserButton, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/your-resume", label: "Your Resume" },
    { to: "/tailored", label: "Tailored Resumes" },
  ];

  return (
    <nav className="w-full flex justify-between items-center py-4 px-8 border-b border-base-300 bg-base-100 sticky top-0 z-50">
      <Link to="/dashboard">
        <h1 className="text-2xl font-extrabold tracking-tight">ApplyWise</h1>
      </Link>

      {isSignedIn ? (
        <div className="flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === to
                  ? "text-primary border-b-2 border-primary pb-0.5"
                  : "text-base-content/70"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="w-px h-6 bg-base-300" />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "!w-9 !h-9",
              },
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link to="/login">
            <button className="btn btn-ghost btn-sm">Login</button>
          </Link>
          <Link to="/register">
            <button className="btn btn-primary btn-sm">Get started</button>
          </Link>
        </div>
      )}
    </nav>
  );
}
