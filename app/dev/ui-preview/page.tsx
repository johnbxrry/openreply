/**
 * TEMPORARY — dev-only UI preview for the Aire rebrand. Delete before merging
 * to main. Renders the dashboard chrome with static mock data so the restyle
 * can be reviewed without a database or Instagram session. Unreachable in
 * production builds.
 */

import { notFound } from "next/navigation";
import UiPreview from "./ui-preview";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiPreview />;
}
