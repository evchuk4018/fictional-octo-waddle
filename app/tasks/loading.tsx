export default function TasksLoading() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="h-24 animate-pulse rounded-card bg-card" />
      <div className="h-24 animate-pulse rounded-card bg-card" />
      <div className="h-24 animate-pulse rounded-card bg-card" />
    </div>
  );
}
