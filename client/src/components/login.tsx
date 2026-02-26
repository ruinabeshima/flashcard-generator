import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <SignIn signUpUrl="/register" forceRedirectUrl="/dashboard" />
    </div>
  );
}
