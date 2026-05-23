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

interface HttpError extends Error {
  status?: number
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Khong the tai danh sach lich kham.'
}

function normalizeText(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function statusBadgeClass(status?: string, statusCode?: string) {
  const code = normalizeText(statusCode)
  const text = normalizeText(status)

  if (code.includes('cancel') || text.includes('huy lich') || text.includes('da huy')) {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (code.includes('complete') || text.includes('da kham')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (code.includes('pending') || text.includes('cho kham') || text.includes('chua kham')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function statusLabel(status?: string, statusCode?: string) {
  const text = String(status || '').trim()
  if (text) return text

  const code = normalizeText(statusCode)
  if (code.includes('cancel')) return 'Da huy'
  if (code.includes('complete')) return 'Da kham'
  if (code.includes('pending')) return 'Cho kham'
  return '-'
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
        setError('Phien dang nhap da het han. Vui long dang nhap lai.')
      } else if (status === 403) {
        setError('Khong co quyen truy cap du lieu lich kham.')
      } else if (status === 500) {
        setError('He thong tam thoi bi loi. Vui long thu lai sau.')
      } else {
        setError(message)
      }

      toast({
        title: 'Loi',
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
          <h1 className="text-3xl font-bold">Lich dat kham</h1>
          <p className="mt-1 text-muted-foreground">
            Toan bo lich hen dat kham trong he thong.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadSchedules()} className="gap-2" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Lam moi
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach lich hen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim theo benh nhan, bac si, chuyen khoa..."
              className="pl-9"
            />
          </div>

          {isLoading && <AdminTableSkeleton rows={8} />}
          {!isLoading && error && <AdminErrorState message={error} onRetry={() => void loadSchedules()} />}
          {!isLoading && !error && filteredSchedules.length === 0 && (
            <AdminEmptyState title="Khong co lich hen phu hop." />
          )}

          {!isLoading && !error && filteredSchedules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma lich</TableHead>
                  <TableHead>Benh nhan</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Chuyen khoa</TableHead>
                  <TableHead>Ngay gio</TableHead>
                  <TableHead>Trang thai</TableHead>
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
                      <Badge className={`border ${statusBadgeClass(item.status, item.statusCode)}`}>
                        {statusLabel(item.status, item.statusCode)}
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
