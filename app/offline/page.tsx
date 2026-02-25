import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full space-y-3 text-center">
        <h1 className="text-xl font-semibold">You are offline</h1>
        <p className="text-sm text-text-secondary">
          Cached tasks are still visible in the app. Reconnect to sync your latest progress.
        </p>
        <Button asChild>
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
