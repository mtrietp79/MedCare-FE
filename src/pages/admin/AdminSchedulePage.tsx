import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminApi, type AdminScheduleEntry } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { getAppointmentStatusClass, getAppointmentStatusLabel } from '@/lib/appointment-status'

interface HttpError extends Error {
  status?: number
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Không thể tải danh sách lịch khám.'
}

function normalizeText(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function statusBadgeClass(status?: string, statusDisplay?: string, statusCode?: string) {
  return getAppointmentStatusClass(statusCode || status, statusDisplay || status)
}

function statusLabel(status?: string, statusDisplay?: string, statusCode?: string) {
  return getAppointmentStatusLabel(statusCode || status, statusDisplay || status)
}

function dateTimeLabel(date?: string, time?: string) {
  const dateText = String(date || '').trim()
  const timeText = String(time || '').trim()
  if (dateText && timeText) return `${dateText} ${timeText}`
  if (dateText) return dateText
  if (timeText) return timeText
  return '-'
}

export function AdminSchedulePage() {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<AdminScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')

  const loadSchedules = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await adminApi.getAdminSchedule()
      setSchedules(Array.isArray(data) ? data : [])
    } catch (loadError: unknown) {
      const status = getErrorStatus(loadError)
      const message = getErrorMessage(loadError)

      if (status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        setError('Không có quyền truy cập dữ liệu lịch khám.')
      } else if (status === 500) {
        setError('Hệ thống tạm thời bị lỗi. Vui lòng thử lại sau.')
      } else {
        setError(message)
      }

      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSchedules()
  }, [])

  const filteredSchedules = useMemo(() => {
    const text = normalizeText(keyword)
    if (!text) return schedules

    return schedules.filter((item) => {
      const haystack = [
        item.appointmentCode,
        item.patientName,
        item.doctorName,
        item.specialtyName,
        item.date,
        item.time,
        item.status,
        item.statusDisplay,
        item.statusCode,
      ]
        .map((value) => normalizeText(value))
        .join(' ')

      return haystack.includes(text)
    })
  }, [keyword, schedules])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch đặt khám</h1>
          <p className="mt-1 text-muted-foreground">
            Toàn bộ lịch hẹn đặt khám trong hệ thống.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadSchedules()} className="gap-2" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo bệnh nhân, bác sĩ, chuyên khoa..."
              className="pl-9"
            />
          </div>

          {isLoading && <AdminTableSkeleton rows={8} />}
          {!isLoading && error && <AdminErrorState message={error} onRetry={() => void loadSchedules()} />}
          {!isLoading && !error && filteredSchedules.length === 0 && (
            <AdminEmptyState title="Không có lịch hẹn phù hợp." />
          )}

          {!isLoading && !error && filteredSchedules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lịch</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Chuyên khoa</TableHead>
                  <TableHead>Ngày giờ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((item) => (
                  <TableRow key={item.id || `${item.appointmentCode}-${item.date}-${item.time}`}>
                    <TableCell>{item.appointmentCode || item.id || '-'}</TableCell>
                    <TableCell>{item.patientName || '-'}</TableCell>
                    <TableCell>{item.doctorName || '-'}</TableCell>
                    <TableCell>{item.specialtyName || '-'}</TableCell>
                    <TableCell>{dateTimeLabel(item.date, item.time)}</TableCell>
                    <TableCell>
                      <Badge className={`border ${statusBadgeClass(item.status, item.statusDisplay, item.statusCode)}`}>
                        {statusLabel(item.status, item.statusDisplay, item.statusCode)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
