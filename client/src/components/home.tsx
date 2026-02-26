import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-5">
      <nav className="flex justify-between px-5 py-3 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AIFlashcards</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <button>Login</button>
          </Link>

          <Link to="/register">
            <button>Get Started</button>
          </Link>
        </div>
      </nav>
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
            <button>Get Started →</button>
          </Link>
        </section>
      </main>
    </div>
  );
}
