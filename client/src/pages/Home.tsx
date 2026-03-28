import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import background from "../assets/background.jpg";
import reference from "../assets/reference.png";
import NavBar from "../components/Navbar";

export default function Home() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col gap-10">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <NavBar />
      <main className="flex flex-col gap-20 items-center">
        <section className="flex flex-col items-center justify-center text-center mt-20 px-15 gap-10">
          <h2 className="text-7xl font-bold">Stay ahead of the curve.</h2>
          <p className="text-lg">
            Apply smarter with personalised AI resume insights, tailored to
            every job description.
          </p>
        </section>

        <section className="mockup-window bg-base-100 border border-base-300 w-9/10 h-150">
          <div className="flex justify-center items-center h-140">
            <img
              src={reference}
              className="object-contain max-h-full max-w-full"
              alt="Reference"
            />
          </div>
        </section>

        <section className="w-4/5">
          <div className="collapse collapse-arrow bg-base-100 border border-base-300">
            <input type="radio" name="my-accordion-2" defaultChecked />
            <div className="collapse-title font-semibold">
              How do I create an account?
            </div>
            <div className="collapse-content text-sm">
              Click the "Get Started" button in the top right corner and follow
              the registration process.
            </div>
          </div>
          <div className="collapse collapse-arrow bg-base-100 border border-base-300">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title font-semibold">
              How do I update my profile information?
            </div>
            <div className="collapse-content text-sm">
              Go to "My Account" settings and select "Edit Profile" to make
              changes.
            </div>
          </div>
        </section>

        <Link to="/register">
          <button className="btn btn-active btn-primary">Get Started →</button>
        </Link>
      </main>

      <footer className="w-full bg-black h-20 flex items-center justify-center">
        <p className="text-white">
          Copyright © {new Date().getFullYear()} - All rights reserved
        </p>
      </footer>
    </div>
  );
}
