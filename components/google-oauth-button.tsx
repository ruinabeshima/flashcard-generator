"use client";

import { Button } from "./ui/button";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";

interface GoogleOAuthButtonProps {
  className?: string;
  // Purpose: Sign in or sign up?
  purpose: string;
}

export default function GoogleOAuthButton({
  className = "",
  purpose = "",
}: GoogleOAuthButtonProps) {
  const handleClick = async () => {
    const supabase = await createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/feed`,
      },
    });
  };

  return (
    // Google Login
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={`flex items-center gap-2 w-full ${className}`}
      onClick={handleClick}
    >
      <FcGoogle className="h-4 w-4" aria-hidden="true" />
      <span>Sign {purpose} with Google</span>
    </Button>
  );
}
