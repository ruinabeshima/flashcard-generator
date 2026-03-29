import { SignUp } from "@clerk/clerk-react";
import background from "../../assets/background.jpg";
import AuthNavbar from "../../components/navbar/AuthNavbar";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center mb-20">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <AuthNavbar />
      <SignUp signInUrl="/login" fallbackRedirectUrl="/onboarding" />
    </div>
  );
}
