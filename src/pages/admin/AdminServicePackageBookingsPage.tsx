import { useEffect, useMemo, useState } from 'react'
import { Edit3, PackageCheck, Search } from 'lucide-react'
import {
  adminApi,
  type AdminServicePackageBooking,
} from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeLower, safeNumber, safeString } from '@/lib/admin-normalizers'
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
  if (text.includes('pending') || text.includes('unpaid') || text.includes('cho thanh toan')) return 'PENDING_PAYMENT'
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

function getStatusBadgeClass(value?: string): string {
  const status = normalizeBookingStatus(value)
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'RECEIVED') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function getPaymentLabel(value?: string): string {
  const text = safeLower(value)
  if (text.includes('paid') || text.includes('da thanh toan')) return 'Đã thanh toán'
  if (text.includes('pending') || text.includes('cho thanh toan') || text.includes('unpaid')) return 'Chờ thanh toán'
  if (!text) return 'Không xác định'
  return value || 'Không xác định'
}

function formatDateTime(booking: AdminServicePackageBooking): string {
  const date = safeString(booking.bookingDate)
  const time = safeString(booking.bookingTime)
  if (date || time) return `${date || '-'} ${time || ''}`.trim()

  const createdAt = safeString(booking.createdAt)
  if (!createdAt) return '-'
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return createdAt
  return parsed.toLocaleString('vi-VN')
}

export function AdminServicePackageBookingsPage() {
  const { toast } = useToast()

  const [bookings, setBookings] = useState<AdminServicePackageBooking[]>([])
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
      const data = await adminApi.getServicePackageBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
        keyword: debouncedSearch.trim() || undefined,
      })

      const normalized = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : []

      setBookings(normalized)
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách phiếu gói dịch vụ.')
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

  const summary = useMemo(() => {
    const total = sortedBookings.length
    const pending = sortedBookings.filter((item) => normalizeBookingStatus(item.status) === 'PENDING_PAYMENT').length
    const paid = sortedBookings.filter((item) => normalizeBookingStatus(item.status) === 'PAID').length
    const received = sortedBookings.filter((item) => normalizeBookingStatus(item.status) === 'RECEIVED').length
    const completed = sortedBookings.filter((item) => normalizeBookingStatus(item.status) === 'COMPLETED').length
    return { total, pending, paid, received, completed }
  }, [sortedBookings])

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
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái phiếu gói dịch vụ.' })
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Phiếu gói dịch vụ</h1>
        <p className="text-muted-foreground">Tiếp nhận và theo dõi trạng thái phiếu dịch vụ của bệnh nhân</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng phiếu</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{summary.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{summary.paid}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã tiếp nhận</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-sky-600">{summary.received}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{summary.completed}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu</CardTitle>
          <CardDescription>Quản lý và cập nhật trạng thái phiếu gói dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã phiếu, bệnh nhân, gói dịch vụ..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: 'all' | BookingStatusKey) => setStatusFilter(value)}>
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
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchBookings()} />}
          {!loading && !error && sortedBookings.length === 0 && (
            <AdminEmptyState title="Không có phiếu gói dịch vụ phù hợp." />
          )}

          {!loading && !error && sortedBookings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
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
                      <div className="text-xs text-muted-foreground">{safeString(booking.patientPhone) || '-'}</div>
                    </TableCell>
                    <TableCell>{safeString(booking.packageName) || '-'}</TableCell>
                    <TableCell>{formatDateTime(booking)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN').format(safeNumber(booking.amount || booking.paidAmount, 0))} đ
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getPaymentLabel(booking.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openStatusDialog(booking)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-sky-600" />
              Cập nhật trạng thái phiếu
            </DialogTitle>
            <DialogDescription>
              Chọn trạng thái mới cho phiếu {safeString(selectedBooking?.bookingCode) || selectedBooking?.id || ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={(value: BookingStatusKey) => setSelectedStatus(value)}>
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
