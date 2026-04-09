import { Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import reference from "../assets/reference.png";
import NavBar from "../components/navbar/Navbar";

export default function Home() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col bg-base-200/40 w-full">
      <div className="fixed inset-0 bg-linear-to-b from-base-200/85 via-base-200/70 to-base-200/90 -z-10" />
      <NavBar />

      <main className="flex w-full flex-1 flex-col items-center gap-10 px-6 pb-16">
        <section className="hero w-full max-w-6xl pt-14">
          <div className="hero-content flex-col items-center text-center">
            <div className="flex flex-col items-center w-full">
              <div className="badge badge-outline">AI-first applications</div>
              <h2 className="mt-4 text-5xl font-bold leading-tight sm:text-6xl">
                Stay ahead of the curve.
              </h2>
              <p className="mt-5 text-lg text-base-content/80">
                Apply smarter with personalised AI resume insights, tailored to
                every job description.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register">
                  <button className="btn btn-primary btn-lg">
                    Get Started →
                  </button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-ghost btn-lg">Login</button>
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="badge badge-neutral badge-outline">
                  Tailored insights
                </span>
                <span className="badge badge-neutral badge-outline">
                  Application tracking
                </span>
                <span className="badge badge-neutral badge-outline">
                  Resume feedback
                </span>
              </div>
            </div>
            <div className="mt-10 flex w-full justify-center">
              <img
                src={reference}
                className="w-full max-w-5xl object-contain"
                alt="Reference"
              />
            </div>
          </div>
        </section>

        <section className="w-full max-w-6xl">
          <div className="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm lg:stats-horizontal">
            <div className="stat">
              <div className="stat-title">Resume clarity</div>
              <div className="stat-value text-3xl">Instant insights</div>
              <div className="stat-desc text-base-content/70">
                Quickly spot gaps and strengths.
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Job targeting</div>
              <div className="stat-value text-3xl">Sharper matches</div>
              <div className="stat-desc text-base-content/70">
                Align with every description.
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Workflow</div>
              <div className="stat-value text-3xl">Organized</div>
              <div className="stat-desc text-base-content/70">
                Track applications in one place.
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="badge badge-primary badge-outline w-fit">
                  Tailored
                </div>
                <h3 className="card-title">Smarter resume suggestions</h3>
                <p className="text-base-content/70">
                  Get focused edits that align your resume with each role.
                </p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="badge badge-primary badge-outline w-fit">
                  Focused
                </div>
                <h3 className="card-title">Personalized insights</h3>
                <p className="text-base-content/70">
                  Highlight the experience that matters most for recruiters.
                </p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="badge badge-primary badge-outline w-fit">
                  Tracked
                </div>
                <h3 className="card-title">Application management</h3>
                <p className="text-base-content/70">
                  Stay on top of progress from first draft to interview.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-6xl">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <h3 className="card-title text-2xl">FAQ</h3>
              <div className="join join-vertical w-full">
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" defaultChecked />
                  <div className="collapse-title font-semibold">
                    How do I create an account?
                  </div>
                  <div className="collapse-content text-sm">
                    Click the "Get Started" button in the top right corner and
                    follow the registration process.
                  </div>
                </div>
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" />
                  <div className="collapse-title font-semibold">
                    What is the registration process?
                  </div>
                  <div className="collapse-content text-sm">
                    Once users create an account, they will be taken to
                    Onboarding where they are required to upload their resume
                    and create an optional job application.
                  </div>
                </div>
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" />
                  <div className="collapse-title font-semibold">
                    How do tailoring sessions work?
                  </div>
                  <div className="collapse-content text-sm">
                    Users get a list of around 20 suggestions they can
                    incorporate into their resume, and they have the option to
                    accept or dismiss these suggestions. AI will generate a new
                    resume based on these choices.
                  </div>
                </div>
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" />
                  <div className="collapse-title font-semibold">
                    Can I reupload my resume?
                  </div>
                  <div className="collapse-content text-sm">
                    Yes you can! All users have the option to view their resumes
                    in window and change it if necessary.
                  </div>
                </div>
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" />
                  <div className="collapse-title font-semibold">
                    How many applications can I track?
                  </div>
                  <div className="collapse-content text-sm">
                    As many as you want!
                  </div>
                </div>
                <div className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                  <input type="radio" name="home-faq" />
                  <div className="collapse-title font-semibold">
                    How many resumes can I tailor?
                  </div>
                  <div className="collapse-content text-sm">
                    All accounts can only tailor maximum 3 resumes with AI.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-6xl">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-3xl">Ready to apply smarter?</h3>
              <p className="text-base-content/70">
                Start tailoring your resume to every role in minutes.
              </p>
              <Link to="/register">
                <button className="btn btn-primary btn-lg">
                  Get Started →
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer footer-center bg-base-200/80 p-6 text-base-content">
        <aside>
          <p>Copyright © {new Date().getFullYear()} - All rights reserved</p>
        </aside>
      </footer>
    </div>
  );
}
