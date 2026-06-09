import { useEffect, useMemo, useState } from 'react'
import { Calendar, DollarSign, Eye, PencilLine, TrendingUp } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeLower, safeNumber, safeString, type NormalizedInvoice } from '@/lib/admin-normalizers'
import {
  getInvoiceAmount,
  getInvoiceCategoryLabel,
  getInvoiceReferenceCode,
  getInvoiceSourceLabel,
  getResolvedInvoiceStatusKey,
  resolveInvoiceDisplayStatus,
} from '@/lib/invoice-contract'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { pickDisplayOrFormatDateTime } from '@/lib/date-display'
import {
  AdminCancellationProcessDialog,
  invoiceHasCancellationRequest,
} from '@/components/admin/AdminCancellationProcessDialog'

interface FinanceSummary {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  paidInvoices: number
  pendingInvoices: number
}

interface HttpError extends Error {
  status?: number
  data?: unknown
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Không thể tải dữ liệu tài chính.'
}

function normalizeSummary(raw: any): FinanceSummary {
  const source = raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' ? raw.data : raw
  return {
    totalRevenue: safeNumber(source?.totalRevenue ?? source?.revenueTotal, 0),
    monthlyRevenue: safeNumber(source?.monthlyRevenue ?? source?.currentMonthRevenue, 0),
    pendingAmount: safeNumber(source?.pendingAmount ?? source?.pendingTotal, 0),
    paidInvoices: safeNumber(source?.paidInvoices ?? source?.paidCount, 0),
    pendingInvoices: safeNumber(source?.pendingInvoices ?? source?.pendingCount, 0),
  }
}

function shortId(value: unknown): string {
  const normalized = safeString(value)
  if (!normalized) return '-'
  return `#${normalized.slice(-8)}`
}

function formatCurrency(amount?: number | null): string {
  return `${Number(amount ?? 0).toLocaleString('vi-VN')} VND`
}


function getPatientDisplayName(invoice: NormalizedInvoice): string {
  return invoice.patientFullName || invoice.patientName || '-'
}

function getDoctorDisplayName(invoice: NormalizedInvoice): string {
  return invoice.doctorFullName || invoice.doctorName || '-'
}

function getInvoiceExamTypeLabel(invoice: NormalizedInvoice): string {
  if (invoice.sourceType === 'SERVICE_PACKAGE' || invoice.invoiceCategory === 'SERVICE_PACKAGE') {
    return 'Gói dịch vụ'
  }

  if (invoice.appointmentTypeDisplay) {
    return invoice.appointmentTypeDisplay
  }

  if (invoice.invoiceCategory === 'FOLLOW_UP') {
    return 'Tái khám'
  }

  if (invoice.invoiceCategory === 'APPOINTMENT_BOOKING' || invoice.invoiceCategory === 'POST_EXAM') {
    return 'Khám bệnh'
  }

  return '-'
}

function getRelatedPrimary(invoice: NormalizedInvoice): string {
  if (invoice.sourceType === 'SERVICE_PACKAGE') {
    return invoice.servicePackageName || 'Gói dịch vụ'
  }

  if (invoice.appointmentTypeDisplay) {
    return invoice.appointmentTypeDisplay
  }

  if (invoice.medicalRecordId || invoice.recordId) {
    return `Bệnh án ${shortId(invoice.medicalRecordId || invoice.recordId)}`
  }

  return '-'
}

function getRelatedSecondary(invoice: NormalizedInvoice): string | null {
  if (invoice.sourceType === 'SERVICE_PACKAGE') {
    return invoice.servicePackageBookingCode ? `Booking: ${invoice.servicePackageBookingCode}` : null
  }

  if (invoice.appointmentCode) {
    return `Lịch: ${invoice.appointmentCode}`
  }

  if (invoice.invoiceCode && invoice.sourceType !== 'INVOICE') {
    return `Mã HĐ: ${invoice.invoiceCode}`
  }

  return null
}

type InvoiceStatusFilter = 'all' | 'unpaid' | 'paid' | 'failed' | 'cancel_requested' | 'cancelled' | 'refunded'
type InvoiceCategoryFilter = 'all' | 'APPOINTMENT_BOOKING' | 'POST_EXAM' | 'FOLLOW_UP' | 'SERVICE_PACKAGE'

export function AdminFinancePage() {
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([])
  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<NormalizedInvoice | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [cancellationInvoice, setCancellationInvoice] = useState<NormalizedInvoice | null>(null)
  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<InvoiceCategoryFilter>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc'>('newest')

  const fetchFinanceData = async () => {
    setLoading(true)
    setError('')

    try {
      const [invoiceRaw, summaryRaw] = await Promise.all([
        adminApi.getInvoices(),
        adminApi.getInvoicesSummary(),
      ])

      setInvoices(Array.isArray(invoiceRaw) ? invoiceRaw : [])
      setSummary(normalizeSummary(summaryRaw))
    } catch (fetchError: unknown) {
      const status = getErrorStatus(fetchError)
      const message = getErrorMessage(fetchError)

      if (status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        setError('Không có quyền truy cập dữ liệu tài chính.')
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
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchFinanceData()
  }, [])

  const filteredInvoices = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    const list = invoices.filter((invoice) => {
      const hitSearch =
        !keyword ||
        [
          invoice.patientName,
          invoice.patientFullName,
          invoice.doctorName,
          invoice.doctorFullName,
          invoice.invoiceCode,
          invoice.appointmentCode,
          invoice.servicePackageBookingCode,
          invoice.servicePackageName,
          invoice.id,
          invoice.medicalRecordId,
          invoice.recordId,
        ].some((value) => safeLower(value).includes(keyword))

      const resolvedStatusKey = getResolvedInvoiceStatusKey(invoice)
      const hitStatus = statusFilter === 'all' || resolvedStatusKey === statusFilter
      const hitCategory = categoryFilter === 'all' || invoice.invoiceCategory === categoryFilter
      return hitSearch && hitStatus && hitCategory
    })

    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }

      if (sortBy === 'amount_desc') {
        return getInvoiceAmount(b) - getInvoiceAmount(a)
      }

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    return list
  }, [invoices, debouncedSearch, statusFilter, categoryFilter, sortBy])

  const statusBadge = (invoice: NormalizedInvoice) => {
    const statusView = resolveInvoiceDisplayStatus(invoice)
    return (
      <Badge className={`rounded-full border ${statusView.className}`}>
        {statusView.label}
      </Badge>
    )
  }

  const openInvoiceDetail = (invoice: NormalizedInvoice) => {
    setSelectedInvoice(invoice)
    setIsDetailDialogOpen(true)
  }

  const openCancellationDialog = (invoice: NormalizedInvoice) => {
    setCancellationInvoice(invoice)
    setIsCancellationDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tài chính</h1>
        <p className="text-muted-foreground">Theo dõi doanh thu và xử lý hóa đơn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              Từ tất cả hóa đơn đã thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Doanh thu từ hóa đơn đã trả trong tháng hiện tại</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{summary.pendingInvoices} hóa đơn đang chờ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.paidInvoices}</div>
            <p className="text-xs text-muted-foreground">Tổng hóa đơn đã thanh toán</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
          <CardDescription>Theo dõi hóa đơn khám bệnh, sau khám, tái khám và gói dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Input
                placeholder="Tìm theo mã, bệnh nhân, bác sĩ, gói dịch vụ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: InvoiceStatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                <SelectItem value="cancel_requested">Đã hủy - chờ xác nhận</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                <SelectItem value="failed">Thanh toán thất bại</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value: InvoiceCategoryFilter) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hóa đơn</SelectItem>
                <SelectItem value="APPOINTMENT_BOOKING">Hóa đơn khám bệnh</SelectItem>
                <SelectItem value="POST_EXAM">Hóa đơn sau khám</SelectItem>
                <SelectItem value="FOLLOW_UP">Hóa đơn tái khám</SelectItem>
                <SelectItem value="SERVICE_PACKAGE">Hóa đơn gói dịch vụ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'amount_desc') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="amount_desc">Số tiền giảm dần</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchFinanceData()} />}
          {!loading && !error && filteredInvoices.length === 0 && <AdminEmptyState title="Không có hóa đơn phù hợp." />}

          {!loading && !error && filteredInvoices.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại hóa đơn</TableHead>
                  <TableHead>Mã tham chiếu</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Liên quan</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow key={invoice.uniqueKey || `${invoice.sourceType}-${invoice.id}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{getInvoiceCategoryLabel(invoice)}</div>
                      <div className="text-xs text-muted-foreground">{getInvoiceSourceLabel(invoice)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getInvoiceReferenceCode(invoice)}</div>
                      <div className="text-xs text-muted-foreground">#{invoice.id}</div>
                    </TableCell>
                    <TableCell>{getPatientDisplayName(invoice)}</TableCell>
                    <TableCell>{getDoctorDisplayName(invoice)}</TableCell>
                    <TableCell>
                      <div>{getRelatedPrimary(invoice)}</div>
                      {getRelatedSecondary(invoice) ? (
                        <div className="text-xs text-muted-foreground">{getRelatedSecondary(invoice)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatCurrency(getInvoiceAmount(invoice))}</TableCell>
                    <TableCell>{statusBadge(invoice)}</TableCell>
                    <TableCell>{pickDisplayOrFormatDateTime(invoice.createdAtDisplay, invoice.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openInvoiceDetail(invoice)} title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoiceHasCancellationRequest(invoice) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCancellationDialog(invoice)}
                            title="Xử lý hủy"
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? getInvoiceCategoryLabel(selectedInvoice) : 'Chi tiết hóa đơn'}</DialogTitle>
            <DialogDescription>{selectedInvoice ? getInvoiceReferenceCode(selectedInvoice) : 'Thông tin chi tiết hóa đơn'}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Nguồn dữ liệu</Label>
                <p>{getInvoiceSourceLabel(selectedInvoice)}</p>
              </div>
              <div>
                <Label>Mã hóa đơn nội bộ</Label>
                <p>#{selectedInvoice.id}</p>
              </div>
              <div>
                <Label>Mã hóa đơn</Label>
                <p>{selectedInvoice.invoiceCode || '-'}</p>
              </div>
              <div>
                <Label>Mã tham chiếu</Label>
                <p>{getInvoiceReferenceCode(selectedInvoice)}</p>
              </div>
              <div>
                <Label>Bệnh nhân</Label>
                <p>{getPatientDisplayName(selectedInvoice)}</p>
              </div>
              <div>
                <Label>Bác sĩ</Label>
                <p>{getDoctorDisplayName(selectedInvoice)}</p>
              </div>
              <div>
                <Label>Hồ sơ bệnh án</Label>
                <p>{shortId(selectedInvoice.medicalRecordId || selectedInvoice.recordId)}</p>
              </div>
              <div>
                <Label>Loại khám</Label>
                <p>{getInvoiceExamTypeLabel(selectedInvoice)}</p>
              </div>
              <div>
                <Label>Booking gói dịch vụ</Label>
                <p>{selectedInvoice.servicePackageBookingCode || '-'}</p>
              </div>
              <div>
                <Label>Tên gói dịch vụ</Label>
                <p>{selectedInvoice.servicePackageName || '-'}</p>
              </div>
              <div>
                <Label>Tổng tiền</Label>
                <p className="font-semibold">{formatCurrency(getInvoiceAmount(selectedInvoice))}</p>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div className="mt-1">{statusBadge(selectedInvoice)}</div>
              </div>
              <div>
                <Label>Ngày tạo</Label>
                <p>{pickDisplayOrFormatDateTime(selectedInvoice.createdAtDisplay, selectedInvoice.createdAt)}</p>
              </div>
              <div>
                <Label>Ngày thanh toán</Label>
                <p>{pickDisplayOrFormatDateTime(selectedInvoice.paidAtDisplay ?? selectedInvoice.paymentDateDisplay, selectedInvoice.paymentDate)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCancellationProcessDialog
        invoice={cancellationInvoice}
        open={isCancellationDialogOpen}
        onOpenChange={setIsCancellationDialogOpen}
        onCompleted={fetchFinanceData}
      />
    </div>
  )
}
