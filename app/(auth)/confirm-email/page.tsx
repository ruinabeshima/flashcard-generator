import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ConfirmEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Confirm your email</CardTitle>
            <CardDescription>
              A confirmation email was just sent to your account. Click the link
              in the email to confirm
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
