"use client";

import { Button } from "./ui/button";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface GoogleOAuthButtonProps {
  className?: string;
  // Purpose: Sign in or sign up?
  purpose: string;
}

export default function GoogleOAuthButton({
  className = "",
  purpose = "",
}: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const handleClick = async () => {
    try {
      setError(null);
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        },
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Google Login
    <>
      <Button
        type="button"
        variant="default"
        size="lg"
        className={`flex items-center gap-2 w-full ${className}`}
        onClick={handleClick}
        disabled={loading}
      >
        <FcGoogle className="h-4 w-4" aria-hidden="true" />
        <span>
          {error
            ? error
            : loading
            ? "Loading..."
            : `Sign ${purpose} with Google`}
        </span>
      </Button>
    </>
  );
}
