import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="w-full flex justify-between py-5 px-7">
      <section className="flex justify-center items-center">
        <h1 className="text-4xl font-bold">AIFlashcards</h1>
      </section>

      {isSignedIn ? (
        <UserButton
          appearance={{
            elements: {
              avatarBox: "!w-12 !h-12",
            },
          }}
        />
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
