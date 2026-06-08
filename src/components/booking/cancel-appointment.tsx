import { useMemo, useState } from 'react'
import { AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'
import type { Appointment } from '@/types'
import { canRequestAppointmentCancellation, getAppointmentCancellationStatusLabel } from '@/lib/appointment-cancellation'
import { isPaymentSettled } from '@/lib/appointment-status'

interface CancelAppointmentProps {
  appointment: Appointment
  onSuccess?: () => void
  onCancel?: () => void
}

function getAppointmentDateTimeLabel(appointment: Appointment): string {
  const rawDateSource = String(appointment.appointmentDate || appointment.date || '').trim()
  const rawTimeSource = String(appointment.appointmentTime || appointment.time || '').trim()

  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const dateSource = (datePrefixMatch?.[1] || rawDateSource).trim()
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()

  const timeMatch = (rawTimeSource || embeddedTime).match(/^(\d{1,2}):(\d{2})/i)
  const timeLabel = timeMatch
    ? `${String(Number(timeMatch[1])).padStart(2, '0')}:${String(Number(timeMatch[2])).padStart(2, '0')}`
    : ''

  const dateObject = dateSource ? new Date(dateSource) : null
  const dateLabel = dateObject && !Number.isNaN(dateObject.getTime()) ? dateObject.toLocaleDateString('vi-VN') : dateSource || ''

  if (!dateLabel && !timeLabel) return '—'
  if (!dateLabel) return timeLabel
  if (!timeLabel) return dateLabel
  return `${dateLabel} ${timeLabel}`
}

function formatCurrency(amount?: number | null): string {
  return `${Number(amount ?? 0).toLocaleString('vi-VN')} VND`
}

export function CancelAppointmentDialog({
  appointment,
  onSuccess,
  onCancel,
}: CancelAppointmentProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountHolder, setBankAccountHolder] = useState('')
  const [patientNote, setPatientNote] = useState('')

  const canCancel = useMemo(() => canRequestAppointmentCancellation(appointment), [appointment])
  const isPaid = isPaymentSettled(appointment.paymentStatus, appointment.paymentStatusDisplay)
  const appointmentLabel = appointment.appointmentCode || `#${appointment.id}`
  const doctorName = appointment.doctor?.fullName || appointment.doctorName || '-'
  const appointmentDateTime = getAppointmentDateTimeLabel(appointment)
  const amountPaid = appointment.consultationFee ?? 0

  if (!canCancel) {
    return null
  }

  const resetForm = () => {
    setCancelReason('')
    setBankName('')
    setBankAccountNumber('')
    setBankAccountHolder('')
    setPatientNote('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onCancel?.()
      resetForm()
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do hủy lịch.',
        variant: 'destructive',
      })
      return
    }

    if (isPaid) {
      if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng nhập đầy đủ thông tin ngân hàng để phòng khám hỗ trợ hoàn tiền.',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setIsSubmitting(true)
      await api.appointments.requestCancellation(String(appointment.id), {
        cancelReason: cancelReason.trim(),
        bankName: isPaid ? bankName.trim() : undefined,
        bankAccountNumber: isPaid ? bankAccountNumber.trim() : undefined,
        bankAccountHolder: isPaid ? bankAccountHolder.trim() : undefined,
        patientNote: patientNote.trim() || undefined,
      })

      toast({
        title: 'Thành công',
        description: 'Gửi yêu cầu hủy lịch thành công. Admin sẽ kiểm tra và xử lý trong thời gian sớm nhất.',
      })
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể gửi yêu cầu hủy lịch.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <X className="h-4 w-4" />
        Hủy lịch
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Yêu cầu hủy lịch và hoàn tiền</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy lịch và thông tin tài khoản ngân hàng để phòng khám hỗ trợ xử lý hoàn tiền thủ công.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã lịch</p>
                <p className="mt-1 font-medium text-foreground">{appointmentLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Bác sĩ</p>
                <p className="mt-1 font-medium text-foreground">{doctorName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày giờ khám</p>
                <p className="mt-1 font-medium text-foreground">{appointmentDateTime}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Số tiền đã thanh toán</p>
                <p className="mt-1 font-medium text-foreground">{formatCurrency(amountPaid)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Vui lòng nhập lý do hủy lịch và thông tin tài khoản ngân hàng để phòng khám hỗ trợ xử lý hoàn tiền thủ công.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Lý do hủy</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={4}
                placeholder="Tôi bận đột xuất nên không thể đến khám."
              />
            </div>

            {isPaid ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Tên ngân hàng</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    placeholder="Vietcombank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-number">Số tài khoản</Label>
                  <Input
                    id="bank-account-number"
                    value={bankAccountNumber}
                    onChange={(event) => setBankAccountNumber(event.target.value)}
                    placeholder="0123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-holder">Tên chủ tài khoản</Label>
                  <Input
                    id="bank-account-holder"
                    value={bankAccountHolder}
                    onChange={(event) => setBankAccountHolder(event.target.value)}
                    placeholder="NGUYEN VAN A"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="patient-note">Ghi chú thêm</Label>
              <Textarea
                id="patient-note"
                value={patientNote}
                onChange={(event) => setPatientNote(event.target.value)}
                rows={3}
                placeholder="Mong phòng khám hỗ trợ."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

