import { Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { safeString } from '@/lib/admin-normalizers'
import type { DoctorMedicine } from '@/services/doctorAppointmentService'

interface MedicineSelectProps {
  open: boolean
  keyword: string
  selectedMedicine: DoctorMedicine | null
  selectedMedicineId?: string
  options: DoctorMedicine[]
  loading?: boolean
  error?: string
  disabled?: boolean
  onOpenChange: (open: boolean) => void
  onKeywordChange: (value: string) => void
  onSelectMedicine: (medicine: DoctorMedicine) => void
  onClearFilter?: () => void
  onRetry?: () => void
}

function formatCurrencyVnd(value?: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

function getUnitLabel(rawUnit?: string): string {
  return safeString(rawUnit) || 'Đơn vị khác'
}

function getCategoryLabel(rawCategory?: string): string {
  return safeString(rawCategory) || 'Khác'
}

function getStockView(medicine: DoctorMedicine): {
  label: string
  className: string
  disabled: boolean
} {
  const stock = Number(medicine.quantity ?? 0)
  const normalizedStatus = safeString(medicine.status).toLowerCase()

  const outOfStock = stock <= 0 || normalizedStatus.includes('out_of_stock') || normalizedStatus.includes('het hang')
  if (outOfStock) {
    return {
      label: 'Hết hàng',
      className: 'border-red-200 bg-red-50 text-red-700',
      disabled: true,
    }
  }

  const lowStock = stock <= 10 || normalizedStatus.includes('low')
  if (lowStock) {
    return {
      label: 'Sắp hết',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      disabled: false,
    }
  }

  return {
    label: 'Còn hàng',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    disabled: false,
  }
}

export function MedicineSelect({
  open,
  keyword,
  selectedMedicine,
  selectedMedicineId,
  options,
  loading = false,
  error,
  disabled,
  onOpenChange,
  onKeywordChange,
  onSelectMedicine,
  onClearFilter,
  onRetry,
}: MedicineSelectProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#334155]">Thuốc</p>
        {loading ? <Spinner className="size-3.5 text-slate-500" /> : null}
      </div>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="h-11 w-full justify-between font-normal"
            disabled={disabled}
          >
            {selectedMedicine ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{selectedMedicine.name}</span>
                <Badge className="h-5 rounded-md border border-slate-200 bg-slate-100 px-2 text-[10px] text-slate-700">
                  {getUnitLabel(selectedMedicine.unit)}
                </Badge>
              </span>
            ) : (
              <span className="text-muted-foreground">Chọn thuốc</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[460px] max-w-[92vw] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Tìm theo tên, danh mục hoặc đơn vị..."
              value={keyword}
              onValueChange={onKeywordChange}
              autoFocus
            />
            <CommandList>
              {loading ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">Đang tải danh sách thuốc...</div>
              ) : null}
              {error ? (
                <div className="space-y-2 px-3 py-4 text-sm text-red-600">
                  <p>{error}</p>
                  {onRetry ? (
                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onRetry}>
                      Thử lại
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <CommandEmpty>
                <div className="space-y-2 px-1 py-2 text-left">
                  <p>Không có thuốc phù hợp.</p>
                  {keyword && onClearFilter ? (
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onClearFilter}>
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {options.map((medicine) => {
                  const stockView = getStockView(medicine)
                  const unitLabel = getUnitLabel(medicine.unit)
                  const categoryLabel = getCategoryLabel(medicine.medicineCategory)
                  const stockValue = Number(medicine.quantity ?? 0)

                  return (
                    <CommandItem
                      key={medicine.id}
                      value={`${medicine.name} ${categoryLabel} ${unitLabel} ${medicine.id}`}
                      disabled={stockView.disabled}
                      onSelect={() => {
                        if (stockView.disabled) return
                        onSelectMedicine(medicine)
                        onOpenChange(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          String(selectedMedicineId) === String(medicine.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />

                      <div className="flex w-full min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#0f172a]">{medicine.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <Badge className="h-5 rounded-md border border-slate-200 bg-slate-100 px-2 text-[10px] text-slate-700">
                              {categoryLabel}
                            </Badge>
                            <span className="text-[11px] text-[#64748b]">Đơn vị: {unitLabel}</span>
                            <Badge className={cn('h-5 rounded-md border px-2 text-[10px]', stockView.className)}>
                              {stockView.label} ({stockValue})
                            </Badge>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[#0f172a]">
                          {formatCurrencyVnd(Number(medicine.price ?? 0))}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
