import { SignIn } from "@clerk/clerk-react";
import background from "../../assets/background.jpg";
import AuthNavbar from "../../components/navbar/AuthNavbar";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col gap-5 items-center">
      <div
        style={{ backgroundImage: `url(${background})` }}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat brightness-80 -z-10"
      />

      <AuthNavbar />
      <SignIn signUpUrl="/register" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
