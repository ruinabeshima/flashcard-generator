import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import background from "../background.png";
import NavBar from "./navbar";

export default function Home() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col gap-5">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <NavBar />
      <main>
        <section className="flex flex-col items-center justify-center text-center mt-20 px-15 gap-10">
          <h2 className="text-7xl font-bold">
            Study Effortlessly with the
            <span className="bg-linear-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text">
              <h2>Power of AI</h2>
            </span>
          </h2>
          <p className="text-lg">
            Generate flashcards from any text using AI and enhance your learning
            experience.
          </p>
          <Link to="/register">
            <button className="btn btn-active btn-primary">
              Get Started →
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
