import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import background from "../../assets/background.jpg";
import AuthNavbar from "../../components/navbar/AuthNavbar";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const token = await cred.user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Sync failed");

      navigate("/dashboard");
    } catch {
      setError("Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);

      const token = await cred.user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Sync failed");

      navigate("/dashboard");
    } catch {
      setError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col gap-5 items-center">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />
      <AuthNavbar />
      <form
        className="card w-full max-w-md bg-base-100 p-6"
        onSubmit={handleEmailLogin}
      >
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <input
          className="input input-bordered w-full mt-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="input input-bordered w-full mt-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="btn btn-primary mt-4" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          className="btn btn-ghost mt-2"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </button>
        {error && <p className="text-sm text-error mt-2">{error}</p>}
        <p className="text-sm mt-3">
          No account?{" "}
          <Link className="link" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
