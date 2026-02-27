import { SignIn } from "@clerk/clerk-react";
import background from "../background.png";
import FormNavBar from "./form_navbar";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col gap-5 items-center">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <FormNavBar />
      <SignIn signUpUrl="/register" forceRedirectUrl="/dashboard" />
    </div>
  );
}
