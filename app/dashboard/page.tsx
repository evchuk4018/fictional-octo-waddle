import { requireUser } from "@/lib/auth";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await requireUser();

  return <DashboardClient email={user.email ?? ""} />;
}
