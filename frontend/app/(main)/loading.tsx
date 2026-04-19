/** Instant shell while navigating between main app routes (perceived performance). */
export default function MainSegmentLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 md:p-8">
      <div className="h-9 w-56 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-24 rounded-xl bg-gray-100" />
      </div>
      <div className="h-64 rounded-xl bg-gray-100" />
    </div>
  );
}
