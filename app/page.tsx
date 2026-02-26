import { redirect } from "next/navigation";

export default function HomePage() {
  console.log("[HomePage] root page hit, redirecting to /dashboard");
  redirect("/dashboard");
}
