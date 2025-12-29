"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/dashboard");
      return;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
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
