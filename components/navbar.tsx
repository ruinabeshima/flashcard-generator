import SignOutButton from "./signout-button";
import { Button } from "./ui/button";

export default function NavBar() {
  return (
    <div className="flex items-center justify-between px-5 py-5">
      <div><p className="text-3xl font-semibold tracking-tight">File Uploader</p></div>
      <div className="flex items-center gap-2">
        <Button>Pricing</Button>
        <SignOutButton />
      </div>
    </div>
  );
}
