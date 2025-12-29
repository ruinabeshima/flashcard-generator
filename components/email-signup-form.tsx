"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailSignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // Passwords not matching
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // No need to do anything with data
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,

      // Email confirmation redirect
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/confirm-email`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redirect to confirm email page 
    if (!data.session) {
      router.push("/confirm-email");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        ></Input>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        ></Input>
        <Input
          type="password"
          placeholder="Confirm Password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
        ></Input>
      </div>

      {loading ? (
        <Button
          type="submit"
          className="w-full"
          size="lg"
          variant="outline"
          disabled
        >
          Loading
        </Button>
      ) : (
        <Button type="submit" className="w-full" variant="default">
          Continue →
        </Button>
      )}

      <div>{error && <p className="text-s text-red-400">{error}</p>}</div>
    </form>
  );
}
