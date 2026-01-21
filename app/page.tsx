import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import background from "../public/background.jpg";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-5">
      <Image
        src={background}
        alt="Background Image"
        fill
        className="object-cover -z-10 opacity-30"
        priority
      ></Image>
      <nav className="flex justify-between px-5 py-3 w-full">
        <div>
          <h1 className="text-2xl font-bold">AIFlashcards</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>

          <Link href="/register">
            <Button variant="default">Get Started</Button>
          </Link>
        </div>
      </nav>
      <main>
        <section className="flex flex-col items-center justify-center text-center mt-20 px-15 gap-10">
          <h2 className="text-7xl font-bold">
            Study Effortlessly with the
            <span className="bg-linear-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text">
              <h2>Power of AI</h2>
            </span>
          </h2>
          <p className="text-lg">
            Generate flashcards from any text using AI and enhance your learning
            experience.
          </p>
          <Link href="/register">
            <Button variant="default" size="lg">
              Get Started →
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
