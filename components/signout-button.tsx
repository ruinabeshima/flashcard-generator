"use client";

import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
        return;
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleClick} type="button" variant="outline">
        {loading ? (
          <span>Loading</span>
        ) : error ? (
          <span>Error</span>
        ) : (
          <span>Sign out</span>
        )}
      </Button>
    </>
  );
}
