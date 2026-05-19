import { AlertTriangle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  )
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-red-200/70 bg-red-50/90 p-6 text-sm text-red-700 shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        Không thể tải dữ liệu
      </div>
      <p className="mb-4 leading-6">{message}</p>
      <Button className="mt-2" size="sm" onClick={onRetry}>Thử lại</Button>
    </div>
  )
}

export function AdminEmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/60 bg-secondary/5 p-8 text-center text-muted-foreground shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
    </div>
  )
}
