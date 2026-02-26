import { SignUp } from "@clerk/clerk-react";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <SignUp signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}
