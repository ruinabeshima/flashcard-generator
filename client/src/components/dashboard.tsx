import { UserButton } from "@clerk/clerk-react";

export default function Dashboard() {
  return (
    <>
      <h1 className="text-5xl">Dashboard</h1>
      <UserButton />
    </>
  );
}
