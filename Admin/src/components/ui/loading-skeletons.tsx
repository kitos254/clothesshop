import { Skeleton } from "@/components/ui/skeleton"

export const SidebarSkeleton = () => {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-5 w-20" />
      </div>
      
      {/* Navigation items */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20 flex-1" />
          </div>
        ))}
      </div>

      {/* Bottom profile section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 p-3 rounded-md">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex space-x-4 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export const UserAvatarSkeleton = () => {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}
