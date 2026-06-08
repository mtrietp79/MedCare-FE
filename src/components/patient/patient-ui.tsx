import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PatientPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function PatientStatusBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold',
        className,
      )}
    >
      {label}
    </Badge>
  )
}

export function PatientInfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function PatientAvatar({
  name,
  size = 'lg',
  className,
}: {
  name?: string
  size?: 'md' | 'lg' | 'xl'
  className?: string
}) {
  const initials = (name || 'BN')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'BN'

  const sizeClass =
    size === 'xl'
      ? 'h-20 w-20 text-2xl'
      : size === 'md'
        ? 'h-12 w-12 text-base'
        : 'h-16 w-16 text-xl'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 font-semibold text-primary ring-2 ring-primary/10',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function PatientEmptyState({
  message,
  icon: Icon,
  action,
}: {
  message: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        {Icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}

export function PatientErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-3" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  )
}

export function PatientLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-6">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}

export function PatientBackLink({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5',
        className,
      )}
    >
      {children}
    </Link>
  )
}
