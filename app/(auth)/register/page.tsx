import GoogleOAuthButton from "@/components/google-oauth-button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { MdOutlineFilePresent } from "react-icons/md";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-10 text-center">
          <div className="space-y-4">
            <Link href="/" className="block">
              <MdOutlineFilePresent className="mx-auto h-10 w-10" />
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">
              Join us today
            </h1>
            <p className="text-sm text-muted-foreground">Create an account</p>
            <Link
              href="/login"
              className="text-sm text-muted-foreground underline"
            >
              Already have one?
            </Link>
          </div>

          <div className="space-y-6">
            <GoogleOAuthButton purpose="up" />
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">
                Or sign up with email
              </span>
              <Separator className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
