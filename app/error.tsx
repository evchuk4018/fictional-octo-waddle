"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full space-y-3 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-text-secondary">Please retry. Your progress data is safe.</p>
        <Button onClick={() => reset()}>Try again</Button>
      </Card>
    </div>
  );
}
