export default function GoalsLoading() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="h-28 animate-pulse rounded-card bg-card" />
      <div className="h-28 animate-pulse rounded-card bg-card" />
      <div className="h-28 animate-pulse rounded-card bg-card" />
    </div>
  );
}
