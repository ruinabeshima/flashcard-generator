import { SignIn } from "@clerk/clerk-react";
import background from "../background.png";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <SignIn signUpUrl="/register" forceRedirectUrl="/dashboard" />
    </div>
  );
}
