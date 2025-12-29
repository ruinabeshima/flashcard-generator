import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-muted">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">We couldn’t sign you in</h1>

        <p className="text-muted-foreground">
          Something went wrong during the sign-in process. Please try again.
        </p>

        <div className="flex flex-col gap-2">
          <Link href="/login">
            <Button>Try Again</Button>
          </Link>

          <Link href="/" className="text-sm text-muted-foreground underline">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
