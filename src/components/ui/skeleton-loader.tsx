import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.ComponentProps<typeof motion.div> {
  count?: number
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('bg-gradient-to-r from-accent via-accent/50 to-accent animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export function DoctorCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="p-4 space-y-4">
        {/* Avatar skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>

        {/* Specialty skeleton */}
        <Skeleton className="h-4 w-2/3 rounded" />

        {/* Rating skeleton */}
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded-full" />
          ))}
        </div>

        {/* Price skeleton */}
        <Skeleton className="h-6 w-1/3 rounded" />

        {/* Button skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </motion.div>
  )
}

export function SpecialtySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4 text-center space-y-3"
    >
      <div className="flex justify-center">
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded mx-auto" />
      <Skeleton className="h-4 w-full rounded" />
    </motion.div>
  )
}

export function AppointmentCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <Skeleton className="w-16 h-16 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded" />
        <Skeleton className="h-8 flex-1 rounded" />
      </div>
    </motion.div>
  )
}

export function FormSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </motion.div>
      ))}
    </motion.div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3 mb-8"
    >
      <Skeleton className="h-8 w-1/3 rounded" />
      <Skeleton className="h-5 w-2/3 rounded" />
    </motion.div>
  )
}

export function GridSkeleton({ count = 6 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: i * 0.05,
          }}
        >
          <DoctorCardSkeleton />
        </motion.div>
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: i * 0.05,
          }}
        >
          <AppointmentCardSkeleton />
        </motion.div>
      ))}
    </div>
  )
}

export { Skeleton }
