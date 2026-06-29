export default function StoreLoading() {
  return (
    <div className="flex flex-col gap-0">
      {/* Hero skeleton */}
      <div className="h-80 bg-blue-900 animate-pulse" />
      {/* Featured books skeleton */}
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-44 shrink-0 rounded-xl bg-gray-100 animate-pulse aspect-[2/3]" />
          ))}
        </div>
      </div>
    </div>
  );
}
