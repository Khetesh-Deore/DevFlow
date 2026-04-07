const S = ({ w = 'w-full', h = 'h-4', rounded = 'rounded', extra = '' }) => (
  <div className={`animate-pulse bg-gray-800 ${h} ${w} ${rounded} ${extra}`} />
);

export function ProblemListSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-800/50">
          <S w="w-6" h="h-4" />
          <S w="w-48" h="h-4" />
          <S w="w-16" h="h-5" rounded="rounded-full" />
          <S w="w-12" h="h-4" extra="ml-auto" />
          <S w="w-20" h="h-4" />
        </div>
      ))}
    </div>
  );
}

export function ProblemDetailSkeleton() {
  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* Left */}
      <div className="w-1/2 border-r border-gray-800 p-6 flex flex-col gap-4 animate-pulse">
        <S w="w-2/3" h="h-7" />
        <div className="flex gap-2">
          <S w="w-16" h="h-5" rounded="rounded-full" />
          <S w="w-20" h="h-5" rounded="rounded-full" />
          <S w="w-14" h="h-5" rounded="rounded-full" />
        </div>
        <S h="h-4" />
        <S h="h-4" w="w-5/6" />
        <S h="h-4" w="w-4/6" />
        <S h="h-4" />
        <S h="h-4" w="w-3/4" />
        <div className="mt-4 bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
          <S w="w-24" h="h-3" />
          <S h="h-16" rounded="rounded-lg" />
          <S w="w-24" h="h-3" />
          <S h="h-10" rounded="rounded-lg" />
        </div>
      </div>
      {/* Right */}
      <div className="w-1/2 bg-gray-900 animate-pulse">
        <div className="h-10 bg-gray-800 border-b border-gray-700" />
        <div className="h-full bg-gray-900" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 animate-pulse">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-8">
        <div className="max-w-6xl mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <S w="w-48" h="h-7" />
            <S w="w-64" h="h-4" />
            <div className="flex gap-6 mt-2">
              {Array.from({ length: 5 }).map((_, i) => <S key={i} w="w-20" h="h-8" rounded="rounded-lg" />)}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3">
            <S w="w-32" h="h-4" />
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-800" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <S key={i} w="w-20" h="h-4" />)}
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-2">
            <S w="w-24" h="h-4" />
            {Array.from({ length: 4 }).map((_, i) => <S key={i} h="h-3" />)}
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-gray-900 rounded-xl p-5">
            <S w="w-40" h="h-5" extra="mb-4" />
            <S h="h-28" rounded="rounded-lg" />
          </div>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-800">
                <S w="w-32" h="h-4" />
                <S w="w-20" h="h-5" rounded="rounded-full" extra="ml-auto" />
                <S w="w-16" h="h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContestCardSkeleton({ count = 3 }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <S w="w-16" h="h-5" rounded="rounded-full" />
            <S w="w-20" h="h-4" />
          </div>
          <S w="w-3/4" h="h-5" extra="mb-2" />
          <S w="w-1/2" h="h-4" extra="mb-4" />
          <div className="flex gap-3">
            <S w="w-24" h="h-4" />
            <S w="w-20" h="h-4" />
          </div>
          <S h="h-9" rounded="rounded-lg" extra="mt-4" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <div className="flex gap-4 px-4 py-3 border-b border-gray-800">
        {[14, 40, 28, 16, 16, 20].map((w, i) => (
          <div key={i} className={`h-3 bg-gray-800 rounded`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/50">
          <S w="w-8" h="h-5" />
          <div className="flex-1 flex flex-col gap-1">
            <S w="w-32" h="h-4" />
            <S w="w-20" h="h-3" />
          </div>
          <S w="w-10" h="h-4" />
          <S w="w-12" h="h-4" />
          <S w="w-10" h="h-4" />
          <S w="w-14" h="h-4" />
        </div>
      ))}
    </div>
  );
}
