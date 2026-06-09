import { useEffect, useMemo, useState } from 'react'
import { Edit3 } from 'lucide-react'
import {
  adminApi,
  type AdminServicePackageBooking,
  type AdminServicePackageStats,
} from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeLower, safeNumber, safeString } from '@/lib/admin-normalizers'
import { formatDateTimeFromParts, pickDisplayOrFormatDateTime } from '@/lib/date-display'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { resolvePaymentStatusView } from '@/lib/appointment-status'
import { Search } from 'lucide-react'

type BookingStatusKey = 'PENDING_PAYMENT' | 'PAID' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'

const statusOptions: Array<{ value: BookingStatusKey; label: string }> = [
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'RECEIVED', label: 'Đã tiếp nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Hủy' },
]

function normalizeBookingStatus(value?: string): BookingStatusKey {
  const text = safeLower(value)
  if (text.includes('pending') || text.includes('unpaid') || text.includes('cho thanh toan'))
    return 'PENDING_PAYMENT'
  if (text.includes('paid') || text.includes('da thanh toan')) return 'PAID'
  if (text.includes('received') || text.includes('da tiep nhan')) return 'RECEIVED'
  if (text.includes('completed') || text.includes('hoan thanh')) return 'COMPLETED'
  if (text.includes('cancel') || text.includes('huy')) return 'CANCELLED'
  return 'PENDING_PAYMENT'
}

function getStatusLabel(value?: string): string {
  const status = normalizeBookingStatus(value)
  return statusOptions.find((item) => item.value === status)?.label || 'Chờ thanh toán'
}

function pickServicePackageStatusLabel(value?: string, statusDisplay?: string): string {
  const display = safeString(statusDisplay)
  if (display) return display
  return getStatusLabel(value)
}

function getStatusBadgeClass(value?: string): string {
  const status = normalizeBookingStatus(value)
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'RECEIVED') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function formatBookingDateTime(booking: AdminServicePackageBooking): string {
  const date = safeString(booking.bookingDate)
  const time = safeString(booking.bookingTime)
  if (date || time) {
    return formatDateTimeFromParts(date, time, booking.bookingDateDisplay)
  }

  return pickDisplayOrFormatDateTime(booking.createdAtDisplay, booking.createdAt)
}

export function PackageBookingsTab() {
  const { toast } = useToast()

  const [bookings, setBookings] = useState<AdminServicePackageBooking[]>([])
  const [packageStats, setPackageStats] = useState<AdminServicePackageStats>({
    totalBooked: 0,
    totalCompleted: 0,
    totalPaid: 0,
    totalPending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatusKey>('all')

  const [selectedBooking, setSelectedBooking] = useState<AdminServicePackageBooking | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<BookingStatusKey>('PENDING_PAYMENT')
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  const fetchBookings = async () => {
    setLoading(true)
    setError('')

    try {
      const [bookingData, statsData] = await Promise.all([
        adminApi.getServicePackageBookings({
          status: statusFilter === 'all' ? undefined : statusFilter,
          keyword: debouncedSearch.trim() || undefined,
        }),
        adminApi.getServicePackageStats().catch(() => ({
          totalBooked: 0,
          totalCompleted: 0,
          totalPaid: 0,
          totalPending: 0,
        })),
      ])

      setBookings(Array.isArray(bookingData) ? bookingData : [])
      setPackageStats({
        totalBooked: safeNumber(statsData.totalBooked, 0),
        totalCompleted: safeNumber(statsData.totalCompleted, 0),
        totalPaid: safeNumber(statsData.totalPaid, 0),
        totalPending: safeNumber(statsData.totalPending, 0),
      })
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách gói dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBookings()
  }, [statusFilter, debouncedSearch])

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const aTime = new Date(safeString(a.createdAt) || 0).getTime()
        const bTime = new Date(safeString(b.createdAt) || 0).getTime()
        return bTime - aTime
      }),
    [bookings]
  )

  const openStatusDialog = (booking: AdminServicePackageBooking) => {
    setSelectedBooking(booking)
    setSelectedStatus(normalizeBookingStatus(booking.status))
    setIsStatusDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedBooking?.id) return

    setUpdating(true)
    try {
      await adminApi.updateServicePackageBookingStatus(String(selectedBooking.id), selectedStatus)
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái booking gói dịch vụ.' })
      setIsStatusDialogOpen(false)
      setSelectedBooking(null)
      await fetchBookings()
    } catch (updateError: any) {
      toast({
        title: 'Lỗi',
        description: updateError?.message || 'Không thể cập nhật trạng thái.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã đặt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageStats.totalBooked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{packageStats.totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{packageStats.totalPaid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{packageStats.totalCompleted}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách booking</CardTitle>
          <CardDescription>Quản lý và cập nhật trạng thái booking gói dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã booking, bệnh nhân, gói dịch vụ..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | BookingStatusKey) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && (
            <AdminErrorState message={error} onRetry={() => void fetchBookings()} />
          )}
          {!loading && !error && sortedBookings.length === 0 && (
            <AdminEmptyState title="Không có booking gói dịch vụ phù hợp." />
          )}

          {!loading && !error && sortedBookings.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã booking</TableHead>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Gói dịch vụ</TableHead>
                    <TableHead>Ngày giờ đến</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {safeString(booking.bookingCode) || `#${safeString(booking.id)}`}
                      </TableCell>
                      <TableCell>
                        <div>{safeString(booking.patientName) || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {safeString(booking.patientPhone) || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{safeString(booking.packageName) || '-'}</TableCell>
                      <TableCell>{formatBookingDateTime(booking)}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN').format(
                          safeNumber(booking.amount || booking.paidAmount, 0)
                        )}{' '}
                        đ
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                          {pickServicePackageStatusLabel(booking.status, booking.statusDisplay)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {resolvePaymentStatusView(booking.paymentStatus, booking.paymentStatusDisplay).label}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(booking)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Cập nhật trạng thái booking</span>
            </DialogTitle>
            <DialogDescription>
              Chọn trạng thái mới cho booking{' '}
              {safeString(selectedBooking?.bookingCode) || selectedBooking?.id || ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: BookingStatusKey) => setSelectedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false)
                setSelectedBooking(null)
              }}
            >
              Hủy
            </Button>
            <Button onClick={() => void handleUpdateStatus()} disabled={updating}>
              {updating ? 'Đang cập nhật...' : 'Lưu trạng thái'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
