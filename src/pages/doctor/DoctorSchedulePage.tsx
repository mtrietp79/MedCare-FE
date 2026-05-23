import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { doctorScheduleService, type DayScheduleItem, type WeekScheduleEntry } from '@/services/doctorScheduleService'
import { safeString } from '@/lib/admin-normalizers'

type Period = 'morning' | 'afternoon'

interface ScheduleCellData {
  count: number
  date: string
  period: Period
}

const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

function toYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDdMmYyyy(value: string): string {
  const match = safeString(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

function getStartOfWeekMonday(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function normalizeType(type: string): string {
  const lower = safeString(type).toLowerCase()
  if (lower.includes('tai') || lower.includes('follow') || lower.includes('revisit')) return 'Tái khám'
  return 'Khám bệnh'
}

function normalizeStatus(status: string): string {
  const lower = safeString(status).toLowerCase()
  if (lower.includes('cancel') || lower.includes('huy')) return 'Hủy lịch'
  if (lower.includes('complete') || lower.includes('da kham')) return 'Đã khám'
  return 'Chờ khám'
}

function getCellClass(count: number): string {
  if (count === 0) return 'bg-slate-50 text-slate-600'
  if (count <= 3) return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-800'
}

function extractWeekEntries(raw: WeekScheduleEntry[] | any): WeekScheduleEntry[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.days)) return raw.days
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

function getEntryDate(entry: WeekScheduleEntry): string {
  return safeString(entry.date)
}

function getEntryPeriod(entry: WeekScheduleEntry): Period {
  const raw = safeString(entry.period).toLowerCase()
  return raw === 'afternoon' ? 'afternoon' : 'morning'
}

function getEntryCount(entry: WeekScheduleEntry): number {
  return Number(entry.patientCount ?? entry.count ?? 0)
}

export function DoctorSchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeekMonday(new Date()))
  const [scheduleMap, setScheduleMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState<ScheduleCellData | null>(null)
  const [dayAppointments, setDayAppointments] = useState<DayScheduleItem[]>([])

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      return date
    }),
    [weekStart]
  )

  const weekRangeLabel = useMemo(() => {
    const first = weekDates[0]
    const last = weekDates[6]
    return `${String(first.getDate()).padStart(2, '0')}/${String(first.getMonth() + 1).padStart(2, '0')} - ${String(last.getDate()).padStart(2, '0')}/${String(last.getMonth() + 1).padStart(2, '0')}/${last.getFullYear()}`
  }, [weekDates])

  const fetchWeekSchedule = async () => {
    setLoading(true)
    setError('')

    try {
      const raw = await doctorScheduleService.getWeekSchedule(toYmd(weekStart))
      const entries = extractWeekEntries(raw)
      const nextMap: Record<string, number> = {}

      for (const entry of entries) {
        const date = getEntryDate(entry)
        const period = getEntryPeriod(entry)
        if (!date) continue
        nextMap[`${date}-${period}`] = getEntryCount(entry)
      }

      setScheduleMap(nextMap)
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải lịch làm việc tuần.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchWeekSchedule()
  }, [weekStart])

  const openCellDetail = async (date: string, period: Period, count: number) => {
    if (count <= 0) return

    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedCell({ date, period, count })

    try {
      const data = await doctorScheduleService.getDaySchedule(date, period)
      setDayAppointments(Array.isArray(data) ? data : [])
    } catch {
      setDayAppointments([])
    } finally {
      setDetailLoading(false)
    }
  }

  const renderCell = (date: Date, period: Period) => {
    const dateKey = toYmd(date)
    const count = scheduleMap[`${dateKey}-${period}`] ?? 0

    return (
      <button
        type="button"
        onClick={() => void openCellDetail(dateKey, period, count)}
        className={`w-full rounded-xl border border-[#e5e7eb] px-3 py-4 text-sm font-semibold transition ${getCellClass(count)} ${count > 0 ? 'hover:opacity-90' : ''}`}
      >
        {count} bệnh nhân
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Lịch làm việc bác sĩ</h1>
          <p className="text-[#6b7280]">Theo dõi số lượng bệnh nhân đặt khám theo từng buổi trong tuần</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setWeekStart((prev) => {
            const next = new Date(prev)
            next.setDate(prev.getDate() - 7)
            return next
          })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-[#111827]">{weekRangeLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart((prev) => {
            const next = new Date(prev)
            next.setDate(prev.getDate() + 7)
            return next
          })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(getStartOfWeekMonday(new Date()))}
          >
            Tuần này
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Thời khóa biểu tuần</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <AdminTableSkeleton rows={6} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchWeekSchedule()} />}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]" />
                  {dayLabels.map((label, index) => (
                    <TableHead key={label} className="text-center">
                      <div>{label}</div>
                      <div className="text-xs text-[#6b7280]">{formatDdMmYyyy(toYmd(weekDates[index]))}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Buổi sáng</TableCell>
                  {weekDates.map((date) => (
                    <TableCell key={`${toYmd(date)}-morning`} className="p-2">
                      {renderCell(date, 'morning')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Buổi chiều</TableCell>
                  {weekDates.map((date) => (
                    <TableCell key={`${toYmd(date)}-afternoon`} className="p-2">
                      {renderCell(date, 'afternoon')}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>Danh sách lịch hẹn theo buổi</DialogTitle>
            <DialogDescription>
              {selectedCell ? `${formatDdMmYyyy(selectedCell.date)} - ${selectedCell.period === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}` : ''}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <AdminTableSkeleton rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên bệnh nhân</TableHead>
                  <TableHead>Giờ khám</TableHead>
                  <TableHead>Loại khám</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{safeString(appointment.patientName) || '-'}</TableCell>
                    <TableCell>{safeString(appointment.time) || '--:--'}</TableCell>
                    <TableCell>{normalizeType(safeString(appointment.type))}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                        {normalizeStatus(safeString(appointment.status))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {dayAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[#6b7280] py-8">
                      Không có lịch hẹn trong buổi này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
