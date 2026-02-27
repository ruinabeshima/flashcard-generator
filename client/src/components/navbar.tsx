import { UserButton } from "@clerk/clerk-react";

export default function NavBar() {
  return (
    <nav className="w-full flex justify-between border border-black py-5 px-7">
      <section className="flex justify-center items-center">
        <h1 className="text-4xl font-bold">AIFlashcards</h1>
      </section>

      <UserButton
        appearance={{
          elements: {
            avatarBox: "!w-12 !h-12",
          },
        }}
      />
    </nav>
  );
}
