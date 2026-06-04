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
import { doctorAppointmentService, type DoctorAppointment } from '@/services/doctorAppointmentService'
import { safeString } from '@/lib/admin-normalizers'
import {
  getAppointmentStatusClass,
  getAppointmentStatusKey,
  getAppointmentStatusLabel,
} from '@/lib/appointment-status'

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
  const ymd = safeString(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!ymd) return value
  return `${ymd[3]}/${ymd[2]}/${ymd[1]}`
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

function getCellClass(count?: number): string {
  if (typeof count !== 'number') return 'border-dashed bg-slate-50 text-slate-500'
  if (count === 0) return 'bg-slate-50 text-slate-700'
  if (count <= 3) return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-800'
}

function parseDateKey(value: string): string | null {
  const raw = safeString(value)
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return raw

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    ) {
      return toYmd(date)
    }
    return null
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return toYmd(parsed)
}

function parseTimeLabel(value: string): string | null {
  const raw = safeString(value)
  if (!raw) return null

  const match = raw.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null

  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

function getAppointmentDateKey(appointment: DoctorAppointment): string | null {
  return parseDateKey(safeString(appointment.appointmentDate) || safeString(appointment.date))
}

function getAppointmentTimeLabel(appointment: DoctorAppointment): string {
  const time =
    parseTimeLabel(safeString(appointment.appointmentTime)) ||
    parseTimeLabel(safeString(appointment.time)) ||
    parseTimeLabel(safeString(appointment.appointmentTimeLabel))

  return time || '--:--'
}

function getAppointmentPeriod(appointment: DoctorAppointment): Period | null {
  const timeLabel = getAppointmentTimeLabel(appointment)
  const hour = Number(timeLabel.slice(0, 2))
  if (!Number.isFinite(hour)) return null
  return hour < 12 ? 'morning' : 'afternoon'
}

function shouldCountAppointment(appointment: DoctorAppointment): boolean {
  return getAppointmentStatusKey(appointment.status, appointment.statusDisplay) !== 'cancelled'
}

export function DoctorSchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeekMonday(new Date()))
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<ScheduleCellData | null>(null)

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
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

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await doctorAppointmentService.getAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (fetchError: any) {
      setAppointments([])
      setError(fetchError?.message || 'Không thể tải lịch hẹn của bác sĩ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAppointments()
  }, [])

  const weekStartKey = useMemo(() => toYmd(weekDates[0]), [weekDates])
  const weekEndKey = useMemo(() => toYmd(weekDates[6]), [weekDates])

  const weekAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const dateKey = getAppointmentDateKey(appointment)
        if (!dateKey) return false
        return dateKey >= weekStartKey && dateKey <= weekEndKey
      }),
    [appointments, weekEndKey, weekStartKey]
  )

  const scheduleMap = useMemo(() => {
    const nextMap: Record<string, number> = {}

    weekDates.forEach((date) => {
      const dateKey = toYmd(date)
      nextMap[`${dateKey}-morning`] = 0
      nextMap[`${dateKey}-afternoon`] = 0
    })

    weekAppointments.forEach((appointment) => {
      if (!shouldCountAppointment(appointment)) return

      const dateKey = getAppointmentDateKey(appointment)
      const period = getAppointmentPeriod(appointment)
      if (!dateKey || !period) return

      const key = `${dateKey}-${period}`
      nextMap[key] = (nextMap[key] || 0) + 1
    })

    return nextMap
  }, [weekAppointments, weekDates])

  const dayAppointments = useMemo(() => {
    if (!selectedCell) return []

    return weekAppointments
      .filter((appointment) => {
        if (!shouldCountAppointment(appointment)) return false
        return (
          getAppointmentDateKey(appointment) === selectedCell.date &&
          getAppointmentPeriod(appointment) === selectedCell.period
        )
      })
      .sort((left, right) => getAppointmentTimeLabel(left).localeCompare(getAppointmentTimeLabel(right)))
  }, [selectedCell, weekAppointments])

  const openCellDetail = (date: string, period: Period, count: number) => {
    if (count <= 0) return

    setDetailOpen(true)
    setSelectedCell({ date, period, count })
  }

  const renderCell = (date: Date, period: Period) => {
    const dateKey = toYmd(date)
    const count = scheduleMap[`${dateKey}-${period}`] ?? 0
    const canOpenDetail = count > 0

    return (
      <button
        type="button"
        onClick={() => openCellDetail(dateKey, period, count)}
        disabled={!canOpenDetail}
        className={`w-full rounded-xl border border-[#e5e7eb] px-3 py-4 text-sm font-semibold transition ${getCellClass(count)} ${canOpenDetail ? 'hover:opacity-90' : ''}`}
      >
        {`${count} bệnh nhân`}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Lịch làm việc bác sĩ</h1>
          <p className="text-[#6b7280]">
            Theo dõi số lượng bệnh nhân đã đặt theo từng buổi trong tuần.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setWeekStart((prev) => {
                const next = new Date(prev)
                next.setDate(prev.getDate() - 7)
                return next
              })
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-[#111827]">{weekRangeLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setWeekStart((prev) => {
                const next = new Date(prev)
                next.setDate(prev.getDate() + 7)
                return next
              })
            }
          >
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
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchAppointments()} />}

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
              {selectedCell
                ? `${formatDdMmYyyy(selectedCell.date)} - ${selectedCell.period === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}`
                : ''}
            </DialogDescription>
          </DialogHeader>

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
                  <TableCell>{safeString(appointment.patient?.fullName) || safeString(appointment.patientName) || '-'}</TableCell>
                  <TableCell>{getAppointmentTimeLabel(appointment)}</TableCell>
                  <TableCell>{normalizeType(safeString(appointment.appointmentType) || safeString(appointment.type))}</TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-full border ${getAppointmentStatusClass(
                        appointment.status,
                        appointment.statusDisplay
                      )}`}
                    >
                      {getAppointmentStatusLabel(appointment.status, appointment.statusDisplay)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {dayAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-[#6b7280]">
                    Không có lịch hẹn trong buổi này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
