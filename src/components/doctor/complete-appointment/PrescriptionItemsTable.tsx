import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface PrescriptionTableItem {
  medicineId: string
  name: string
  category: string
  unit: string
  quantity: number
  unitPrice: number
  lineTotal: number
  dosage: string
  note: string
}

interface PrescriptionItemsTableProps {
  items: PrescriptionTableItem[]
  onDeleteItem: (index: number) => void
}

function formatCurrencyVnd(value?: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

export function PrescriptionItemsTable({ items, onDeleteItem }: PrescriptionItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        Chưa có thuốc nào được thêm. Hãy chọn thuốc và bấm "Thêm thuốc".
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <div className="max-h-[280px] overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Thuốc</th>
                <th className="px-3 py-2.5">Danh mục</th>
                <th className="px-3 py-2.5">Đơn vị</th>
                <th className="px-3 py-2.5">Số lượng</th>
                <th className="px-3 py-2.5">Đơn giá</th>
                <th className="px-3 py-2.5">Thành tiền</th>
                <th className="px-3 py-2.5">Liều dùng</th>
                <th className="px-3 py-2.5">Ghi chú</th>
                <th className="px-3 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.medicineId}-${index}`} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{item.name}</td>
                  <td className="px-3 py-2.5">
                    <Badge className="h-6 rounded-md border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-700">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{item.unit}</td>
                  <td className="px-3 py-2.5 text-slate-900">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-slate-700">{formatCurrencyVnd(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{formatCurrencyVnd(item.lineTotal)}</td>
                  <td className="px-3 py-2.5 text-slate-700">{item.dosage || '-'}</td>
                  <td className="px-3 py-2.5 text-slate-700">{item.note || '-'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => onDeleteItem(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={8}>Xóa thuốc</TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item, index) => (
          <div key={`${item.medicineId}-${index}`} className="relative rounded-lg border border-slate-200 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => onDeleteItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Xóa thuốc</TooltipContent>
            </Tooltip>

            <div className="pr-10">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge className="h-6 rounded-md border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-700">
                  {item.category}
                </Badge>
                <span className="text-xs text-slate-600">{item.unit}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <p>Số lượng</p>
                <p className="text-sm font-medium text-slate-900">{item.quantity}</p>
              </div>
              <div>
                <p>Đơn giá</p>
                <p className="text-sm font-medium text-slate-900">{formatCurrencyVnd(item.unitPrice)}</p>
              </div>
              <div>
                <p>Liều dùng</p>
                <p className="text-sm font-medium text-slate-900">{item.dosage || '-'}</p>
              </div>
              <div>
                <p>Thành tiền</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrencyVnd(item.lineTotal)}</p>
              </div>
              <div className="col-span-2">
                <p>Ghi chú</p>
                <p className="text-sm font-medium text-slate-900">{item.note || '-'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
