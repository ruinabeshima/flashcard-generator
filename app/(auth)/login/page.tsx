import GoogleOAuthButton from "@/components/google-oauth-button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MdOutlineFilePresent } from "react-icons/md";
import EmailLoginForm from "@/components/email-login-form";

export default function Login() {
  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-sm">
          <div className="space-y-10 text-center">
            <div className="space-y-4">
              <Link href="/" className="block">
                <MdOutlineFilePresent className="mx-auto h-10 w-10" />
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account
              </p>
              <Link
                href="/register"
                className="text-sm text-muted-foreground underline"
              >
                Don't have one?
              </Link>
            </div>

            <div className="space-y-6">
              <GoogleOAuthButton purpose="in" />
              <div className="flex items-center gap-4">
                <Separator className="flex-1 bold" />
                <span className="text-sm text-muted-foreground">
                  Or sign in with email
                </span>
                <Separator className="flex-1" />
              </div>
              <EmailLoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
