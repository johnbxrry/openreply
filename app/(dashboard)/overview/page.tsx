import { redirect } from "next/navigation";

/* The Instagram analytics page moved from /overview to /dashboard. */
export default function OverviewRedirectPage() {
  redirect("/dashboard");
}
