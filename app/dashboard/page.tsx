import { requireUser } from "@/lib/auth";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  await requireUser();

  return <DashboardClient />;
}
