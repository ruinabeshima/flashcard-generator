import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import useApiClient from "../lib/useApiClient";

export default function useAuthFlow() {
  const api = useApiClient();
  const navigate = useNavigate();
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const syncUser = async () => {
    await api.post("/auth/sync", {});
  };

  const handleEmailRegister = async (
    event: React.FormEvent,
    email: string,
    password: string,
    confirmPassword: string,
  ) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      await syncUser();
      navigate("/onboarding");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Try a stronger password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await syncUser();
      navigate("/onboarding");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Google sign-up failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (
    event: React.FormEvent,
    email: string,
    password: string,
  ) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUser();
      navigate("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await syncUser();
      navigate("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Google sign-in failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    handleEmailRegister,
    handleGoogleRegister,
    handleEmailLogin,
    handleGoogleLogin,
  };
}
