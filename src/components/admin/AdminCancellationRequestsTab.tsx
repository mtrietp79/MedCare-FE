import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CreditCard, Eye, RefreshCcw, Search, XCircle } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/use-toast'
import { adminApi, type AdminCancellationRequest, type AdminCancellationRequestSummary } from '@/services/adminService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  getCancellationRequestAdminStatusLabel,
  getCancellationRequestStatusClass,
  getCancellationRequestStatusDescription,
  getCancellationRequestStatusKey,
} from '@/lib/cancellation-request-contract'

type RequestStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REFUNDED' | 'REJECTED'
type RequestSort = 'newest' | 'oldest'
type RequestAction = 'approve' | 'reject' | 'refund'

interface RequestStatsCardProps {
  label: string
  value: number
  tone: string
}

function formatCurrency(amount?: number | null): string {
  return `${Number(amount ?? 0).toLocaleString('vi-VN')} VND`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function formatAppointmentDateTime(request: AdminCancellationRequest): string {
  const rawDateSource = String(request.appointmentDate || request.appointmentDateTime || '').trim()
  const rawTimeSource = String(request.appointmentTime || '').trim()

  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const dateSource = (datePrefixMatch?.[1] || rawDateSource).trim()
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()
  const timeMatch = (rawTimeSource || embeddedTime).match(/^(\d{1,2}):(\d{2})/i)
  const timeLabel = timeMatch
    ? `${String(Number(timeMatch[1])).padStart(2, '0')}:${String(Number(timeMatch[2])).padStart(2, '0')}`
    : ''

  const dateObject = dateSource ? new Date(dateSource) : null
  const dateLabel = dateObject && !Number.isNaN(dateObject.getTime()) ? dateObject.toLocaleDateString('vi-VN') : dateSource || '-'

  if (dateLabel === '-' && !timeLabel) return '-'
  if (dateLabel === '-') return timeLabel
  if (!timeLabel) return dateLabel
  return `${dateLabel} ${timeLabel}`
}

function getPatientName(request: AdminCancellationRequest): string {
  return request.patientFullName || request.patientName || '-'
}

function getDoctorName(request: AdminCancellationRequest): string {
  return request.doctorFullName || request.doctorName || '-'
}

function getStatusTone(status: RequestStatusFilter): string {
  if (status === 'APPROVED') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'REFUNDED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function StatCard({ label, value, tone }: RequestStatsCardProps) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function AdminCancellationRequestsTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<AdminCancellationRequest[]>([])
  const [stats, setStats] = useState<AdminCancellationRequestSummary>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<RequestSort>('newest')
  const [page, setPage] = useState(0)
  const size = 10

  const [selectedRequest, setSelectedRequest] = useState<AdminCancellationRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<RequestAction | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [pageData, statsData] = await Promise.all([
        adminApi.getCancellationRequests({
          keyword: debouncedSearch,
          status: statusFilter,
          page,
          size,
          sort: sortBy,
        }),
        adminApi.getCancellationRequestsStats(),
      ])
      setItems(pageData.items || [])
      setStats(statsData || {})
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải danh sách yêu cầu hủy.')
      toast({
        title: 'Lỗi',
        description: fetchError instanceof Error ? fetchError.message : 'Không thể tải danh sách yêu cầu hủy.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [debouncedSearch, statusFilter, sortBy, page])

  const statsCards = useMemo(
    () => [
      { label: 'Tổng yêu cầu', value: stats.total ?? items.length, tone: 'text-slate-900' },
      { label: 'Chờ xử lý', value: stats.pending ?? 0, tone: 'text-amber-700' },
      { label: 'Đã duyệt', value: stats.approved ?? 0, tone: 'text-blue-700' },
      { label: 'Đã hoàn tiền', value: stats.refunded ?? 0, tone: 'text-emerald-700' },
      { label: 'Từ chối', value: stats.rejected ?? 0, tone: 'text-red-700' },
    ],
    [items.length, stats]
  )

  const openDetail = (request: AdminCancellationRequest) => {
    setSelectedRequest(request)
    setDetailOpen(true)
  }

  const openAction = (request: AdminCancellationRequest, type: RequestAction) => {
    setSelectedRequest(request)
    setActionType(type)
    setActionNote(
      type === 'approve'
        ? 'Đồng ý hủy lịch và xử lý hoàn tiền thủ công.'
        : type === 'refund'
          ? 'Đã chuyển khoản hoàn tiền ngoài hệ thống.'
          : 'Yêu cầu hủy không hợp lệ.'
    )
    setActionOpen(true)
  }

  const closeAction = () => {
    setActionOpen(false)
    setActionType(null)
    setActionNote('')
    setActionLoading(false)
  }

  const submitAction = async () => {
    if (!selectedRequest || !actionType) return
    if (!actionNote.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập ghi chú admin.',
        variant: 'destructive',
      })
      return
    }

    try {
      setActionLoading(true)
      if (actionType === 'approve') {
        await adminApi.approveCancellationRequest(selectedRequest.id, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Duyệt yêu cầu hủy thành công' })
      } else if (actionType === 'reject') {
        await adminApi.rejectCancellationRequest(selectedRequest.id, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Từ chối yêu cầu hủy thành công' })
      } else {
        await adminApi.markCancellationRequestRefunded(selectedRequest.id, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Đã đánh dấu xử lý hoàn tiền' })
      }

      closeAction()
      await loadData()
    } catch (submitError: unknown) {
      toast({
        title: 'Lỗi',
        description: submitError instanceof Error ? submitError.message : 'Không thể cập nhật yêu cầu hủy.',
        variant: 'destructive',
      })
      setActionLoading(false)
    }
  }

  const statusBadge = (request: AdminCancellationRequest) => (
    <Badge className={`rounded-full border ${getCancellationRequestStatusClass(request.status, request.statusDisplay)}`}>
      {getCancellationRequestAdminStatusLabel(request.status, request.statusDisplay)}
    </Badge>
  )

  const totalPages = stats.total && items.length < size ? Math.max(1, Math.ceil((stats.total || 0) / size)) : undefined
  const canGoPrev = page > 0
  const canGoNext = totalPages ? page + 1 < totalPages : items.length === size

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statsCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <Card className="border-border/70">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value)
                  setPage(0)
                }}
                placeholder="Tìm theo mã lịch, bệnh nhân, email, bác sĩ..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: RequestStatusFilter) => {
                setStatusFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: RequestSort) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Mới nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
              Tải lại
            </Button>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadData()} />}
          {!loading && !error && items.length === 0 && <AdminEmptyState title="Không có yêu cầu hủy/hoàn tiền." />}

          {!loading && !error && items.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lịch</TableHead>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Bác sĩ</TableHead>
                    <TableHead>Ngày khám</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((request, index) => {
                    const requestStatus = getCancellationRequestStatusKey(request.status, request.statusDisplay)
                    return (
                      <TableRow key={request.uniqueKey || `${request.id}-${index}`}>
                        <TableCell className="font-medium">{request.appointmentCode || `#${request.appointmentId || request.id}`}</TableCell>
                        <TableCell>
                          <div className="font-medium">{getPatientName(request)}</div>
                          <div className="text-xs text-muted-foreground">{request.patientEmail || request.patientPhone || '-'}</div>
                        </TableCell>
                        <TableCell>{getDoctorName(request)}</TableCell>
                        <TableCell>{formatAppointmentDateTime(request)}</TableCell>
                        <TableCell>{formatCurrency(request.amount)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{request.bankName || '-'}</div>
                          <div className="text-xs text-muted-foreground">{request.bankAccountNumber || '-'}</div>
                        </TableCell>
                        <TableCell>{statusBadge(request)}</TableCell>
                        <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDetail(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {requestStatus === 'pending' ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => openAction(request, 'approve')}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openAction(request, 'reject')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                            {requestStatus === 'approved' ? (
                              <Button variant="ghost" size="sm" onClick={() => openAction(request, 'refund')}>
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Trang {page + 1}
                  {typeof totalPages === 'number' ? ` / ${totalPages}` : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={!canGoPrev}>
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!canGoNext}>
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hủy</DialogTitle>
            <DialogDescription>Thông tin lịch, ngân hàng và trạng thái xử lý.</DialogDescription>
          </DialogHeader>
          {selectedRequest ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã lịch</p>
                  <p className="mt-1 font-medium">{selectedRequest.appointmentCode || `#${selectedRequest.appointmentId || selectedRequest.id}`}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bệnh nhân</p>
                  <p className="mt-1 font-medium">{getPatientName(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email bệnh nhân</p>
                  <p className="mt-1 font-medium">{selectedRequest.patientEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
                  <p className="mt-1 font-medium">{selectedRequest.patientPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bác sĩ</p>
                  <p className="mt-1 font-medium">{getDoctorName(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày giờ khám</p>
                  <p className="mt-1 font-medium">{formatAppointmentDateTime(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Số tiền đã thanh toán</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedRequest.amount)}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <p className="font-semibold">Thông tin hủy</p>
                  <p className="mt-2 text-muted-foreground">Lý do hủy: {selectedRequest.cancelReason || '-'}</p>
                  <p className="mt-1 text-muted-foreground">Ghi chú bệnh nhân: {selectedRequest.patientNote || '-'}</p>
                  <p className="mt-1 text-muted-foreground">Ngày gửi: {formatDateTime(selectedRequest.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <p className="font-semibold">Thông tin ngân hàng</p>
                  <p className="mt-2 text-muted-foreground">Tên ngân hàng: {selectedRequest.bankName || '-'}</p>
                  <p className="mt-1 text-muted-foreground">Số tài khoản: {selectedRequest.bankAccountNumber || '-'}</p>
                  <p className="mt-1 text-muted-foreground">Tên chủ tài khoản: {selectedRequest.bankAccountHolder || '-'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-4">
                <p className="font-semibold">Thông tin xử lý</p>
                <p className="mt-2 text-muted-foreground">Trạng thái: {getCancellationRequestAdminStatusLabel(selectedRequest.status, selectedRequest.statusDisplay)}</p>
                <p className="mt-1 text-muted-foreground">Ghi chú admin: {selectedRequest.adminNote || '-'}</p>
                <p className="mt-1 text-muted-foreground">Người xử lý: {selectedRequest.processedByName || selectedRequest.processedBy || '-'}</p>
                <p className="mt-1 text-muted-foreground">Thời gian xử lý: {formatDateTime(selectedRequest.processedAt)}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={(open) => (!open ? closeAction() : setActionOpen(open))}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Duyệt yêu cầu'
                : actionType === 'reject'
                  ? 'Từ chối'
                  : 'Đánh dấu đã hoàn tiền'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'refund'
                ? 'Hành động này chỉ ghi nhận rằng admin đã xử lý hoàn tiền ngoài hệ thống. MedCare không thực hiện chuyển tiền tự động.'
                : 'Nhập ghi chú admin để ghi nhận xử lý yêu cầu hủy.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-note">Ghi chú admin</Label>
            <Textarea
              id="admin-note"
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={() => void submitAction()} disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : actionType === 'approve' ? 'Duyệt yêu cầu' : actionType === 'reject' ? 'Từ chối' : 'Đánh dấu đã hoàn tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

