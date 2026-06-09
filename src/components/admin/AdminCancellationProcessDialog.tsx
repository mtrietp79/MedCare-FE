import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { adminApi } from '@/services/adminService'
import type { NormalizedInvoice } from '@/lib/admin-normalizers'
import { getInvoiceAmount } from '@/lib/invoice-contract'
import {
  getCancellationRequestAdminStatusLabel,
  getCancellationRequestStatusKey,
  type CancellationRequestItem,
} from '@/lib/cancellation-request-contract'
import { getAppointmentStatusLabel } from '@/lib/appointment-status'
import { formatDateTimeFromParts, pickDisplayOrFormatDateTime } from '@/lib/date-display'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type RequestAction = 'approve' | 'reject' | 'refund'

interface AdminCancellationProcessDialogProps {
  invoice: NormalizedInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => Promise<void> | void
}

function formatCurrency(amount?: number | null): string {
  return `${Number(amount ?? 0).toLocaleString('vi-VN')} VND`
}

function displayText(value?: string | null): string {
  const text = String(value ?? '').trim()
  return text || '-'
}

function formatAppointmentDateTime(invoice: NormalizedInvoice): string {
  return formatDateTimeFromParts(
    invoice.appointmentDate || invoice.appointmentDateTime,
    invoice.appointmentTime,
    invoice.appointmentDateDisplay,
  )
}

export function AdminCancellationProcessDialog({
  invoice,
  open,
  onOpenChange,
  onCompleted,
}: AdminCancellationProcessDialogProps) {
  const { toast } = useToast()
  const [actionType, setActionType] = useState<RequestAction | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelRequest, setCancelRequest] = useState<CancellationRequestItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const cancellationRequestId = String(invoice?.cancellationRequestId || '').trim()

  const cancellationStatus = cancelRequest?.status ?? invoice?.cancellationStatus
  const cancellationStatusDisplay = cancelRequest?.statusDisplay ?? invoice?.cancellationStatusDisplay
  const requestStatusKey = getCancellationRequestStatusKey(cancellationStatus, cancellationStatusDisplay)

  const canApprove = requestStatusKey === 'pending'
  const canReject = requestStatusKey === 'pending'
  const canMarkRefunded = requestStatusKey === 'approved'

  useEffect(() => {
    if (!open) {
      setActionType(null)
      setActionNote('')
      setActionLoading(false)
      setCancelRequest(null)
      setDetailLoading(false)
      setDetailError('')
      return
    }

    if (!cancellationRequestId) {
      const message = 'Không tìm thấy mã yêu cầu hủy.'
      setDetailError(message)
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      })
      return
    }

    let cancelled = false

    const loadDetail = async () => {
      setDetailLoading(true)
      setDetailError('')
      setCancelRequest(null)

      try {
        const detail = await adminApi.getCancellationRequestById(cancellationRequestId)
        if (cancelled) return

        if (!detail) {
          const message = 'Không tìm thấy thông tin yêu cầu hủy.'
          setDetailError(message)
          toast({
            title: 'Lỗi',
            description: message,
            variant: 'destructive',
          })
          return
        }

        setCancelRequest(detail)
      } catch (fetchError: unknown) {
        if (cancelled) return
        const message =
          fetchError instanceof Error ? fetchError.message : 'Không thể tải chi tiết yêu cầu hủy.'
        setDetailError(message)
        toast({
          title: 'Lỗi',
          description: message,
          variant: 'destructive',
        })
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [open, cancellationRequestId, toast])

  const defaultNote = useMemo(() => {
    if (actionType === 'approve') return 'Đồng ý hủy lịch và xử lý hoàn tiền thủ công.'
    if (actionType === 'refund') return 'Đã chuyển khoản hoàn tiền ngoài hệ thống.'
    if (actionType === 'reject') return 'Yêu cầu hủy không hợp lệ.'
    return ''
  }, [actionType])

  useEffect(() => {
    if (actionType) {
      setActionNote(defaultNote)
    }
  }, [actionType, defaultNote])

  const submitAction = async () => {
    if (!invoice || !actionType || !cancellationRequestId) return
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
        await adminApi.approveCancellationRequest(cancellationRequestId, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Duyệt yêu cầu hủy thành công.' })
      } else if (actionType === 'reject') {
        await adminApi.rejectCancellationRequest(cancellationRequestId, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Từ chối yêu cầu hủy thành công.' })
      } else {
        await adminApi.markCancellationRequestRefunded(cancellationRequestId, { adminNote: actionNote.trim() })
        toast({ title: 'Thành công', description: 'Đã đánh dấu xử lý hoàn tiền.' })
      }

      setActionType(null)
      setActionNote('')
      onOpenChange(false)
      await onCompleted()
    } catch (submitError: unknown) {
      toast({
        title: 'Lỗi',
        description: submitError instanceof Error ? submitError.message : 'Không thể cập nhật yêu cầu hủy.',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (!invoice) return null

  return (
    <>
      <Dialog open={open && !actionType} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>Xử lý yêu cầu hủy</DialogTitle>
            <DialogDescription>Thông tin lịch, yêu cầu hủy và tài khoản hoàn tiền.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Spinner className="size-6" />
              <span>Đang tải thông tin yêu cầu hủy...</span>
            </div>
          ) : detailError ? (
            <div className="py-8 text-center text-sm text-destructive">{detailError}</div>
          ) : cancelRequest ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã lịch</p>
                  <p className="mt-1 font-medium">
                    {invoice.appointmentCode || cancelRequest.appointmentCode || `#${invoice.appointmentId || invoice.id}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bệnh nhân</p>
                  <p className="mt-1 font-medium">
                    {invoice.patientFullName || invoice.patientName || cancelRequest.patientFullName || cancelRequest.patientName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bác sĩ</p>
                  <p className="mt-1 font-medium">
                    {invoice.doctorFullName || invoice.doctorName || cancelRequest.doctorFullName || cancelRequest.doctorName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày giờ khám</p>
                  <p className="mt-1 font-medium">{formatAppointmentDateTime(invoice)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng tiền</p>
                  <p className="mt-1 font-medium">{formatCurrency(cancelRequest.amount ?? getInvoiceAmount(invoice))}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái lịch</p>
                  <p className="mt-1 font-medium">
                    {getAppointmentStatusLabel(invoice.appointmentStatus ?? undefined, invoice.appointmentStatusDisplay ?? undefined)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <p className="font-semibold">Thông tin yêu cầu hủy</p>
                  <p className="mt-2 text-muted-foreground">Lý do hủy: {displayText(cancelRequest.cancelReason)}</p>
                  <p className="mt-1 text-muted-foreground">Ghi chú bệnh nhân: {displayText(cancelRequest.patientNote)}</p>
                  <p className="mt-1 text-muted-foreground">Ngày gửi yêu cầu: {pickDisplayOrFormatDateTime(cancelRequest.createdAtDisplay, cancelRequest.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <p className="font-semibold">Thông tin ngân hàng</p>
                  <p className="mt-2 text-muted-foreground">Tên ngân hàng: {displayText(cancelRequest.bankName)}</p>
                  <p className="mt-1 text-muted-foreground">Số tài khoản: {displayText(cancelRequest.bankAccountNumber)}</p>
                  <p className="mt-1 text-muted-foreground">Tên chủ tài khoản: {displayText(cancelRequest.bankAccountHolder)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-4">
                <p className="font-semibold">Thông tin xử lý</p>
                <p className="mt-2 text-muted-foreground">
                  Trạng thái yêu cầu: {getCancellationRequestAdminStatusLabel(cancellationStatus, cancellationStatusDisplay)}
                </p>
                <p className="mt-1 text-muted-foreground">Ghi chú admin: {displayText(cancelRequest.adminNote)}</p>
              </div>
            </div>
          ) : null}

          {!detailLoading && !detailError && cancelRequest && (canApprove || canReject || canMarkRefunded) ? (
            <DialogFooter className="gap-2 sm:justify-end">
              {canApprove ? (
                <Button variant="default" onClick={() => setActionType('approve')}>
                  Duyệt yêu cầu
                </Button>
              ) : null}
              {canReject ? (
                <Button variant="outline" onClick={() => setActionType('reject')}>
                  Từ chối yêu cầu
                </Button>
              ) : null}
              {canMarkRefunded ? (
                <Button variant="secondary" onClick={() => setActionType('refund')}>
                  Đánh dấu đã hoàn tiền
                </Button>
              ) : null}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(actionType)} onOpenChange={(nextOpen) => (!nextOpen ? setActionType(null) : null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Duyệt yêu cầu'
                : actionType === 'reject'
                  ? 'Từ chối yêu cầu'
                  : 'Đánh dấu đã hoàn tiền'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'refund'
                ? 'Hành động này chỉ ghi nhận rằng admin đã xử lý hoàn tiền ngoài hệ thống. MedCare không thực hiện chuyển tiền tự động.'
                : 'Nhập ghi chú admin để ghi nhận xử lý yêu cầu hủy.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-cancellation-note">Ghi chú admin</Label>
            <Textarea
              id="admin-cancellation-note"
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={() => void submitAction()} disabled={actionLoading}>
              {actionLoading
                ? 'Đang xử lý...'
                : actionType === 'approve'
                  ? 'Duyệt yêu cầu'
                  : actionType === 'reject'
                    ? 'Từ chối yêu cầu'
                    : 'Đánh dấu đã hoàn tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function invoiceHasCancellationRequest(invoice: NormalizedInvoice): boolean {
  return Boolean(invoice.hasCancellationRequest && invoice.cancellationRequestId)
}

export function invoiceHasActionableCancellationRequest(invoice: NormalizedInvoice): boolean {
  if (!invoiceHasCancellationRequest(invoice)) return false

  const cancellationStatus = String(invoice.cancellationStatus || '').trim().toUpperCase()
  if (cancellationStatus === 'PENDING' || cancellationStatus === 'APPROVED') return true

  const requestKey = getCancellationRequestStatusKey(invoice.cancellationStatus, invoice.cancellationStatusDisplay)
  return requestKey === 'pending' || requestKey === 'approved'
}
