import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface CategoryOption {
  value: string
  label: string
}

interface MedicineCategorySelectProps {
  value: string
  options: CategoryOption[]
  loading?: boolean
  error?: string
  disabled?: boolean
  onValueChange: (value: string) => void
  onRetry?: () => void
}

export function MedicineCategorySelect({
  value,
  options,
  loading = false,
  error,
  disabled,
  onValueChange,
  onRetry,
}: MedicineCategorySelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#334155]">Danh mục thuốc</Label>

      {loading ? (
        <Skeleton className="h-11 w-full" />
      ) : (
        <Select value={value} onValueChange={onValueChange} disabled={disabled || options.length === 0}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {options.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error ? (
        <div className="flex items-center gap-2">
          <p className="text-xs text-red-600">{error}</p>
          {onRetry && (
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onRetry}>
              Thử lại
            </Button>
          )}
        </div>
      ) : null}

      {!loading && !error && options.length === 0 ? (
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#64748b]">Chưa có danh mục thuốc.</p>
          {onRetry && (
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onRetry}>
              Tải lại
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
