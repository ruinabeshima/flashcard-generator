import { SignUp } from "@clerk/clerk-react";
import background from "../background.jpg";
import FormNavBar from "./form_navbar";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center mb-20">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <FormNavBar />
      <SignUp signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}
