import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to sign-in page
  redirect("/sign-in")

  return null
}
