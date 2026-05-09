import { useState } from 'react'
import { AlertCircle, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/services/api'
import type { Appointment } from '@/types'

interface CancelAppointmentProps {
  appointment: Appointment
  onSuccess?: () => void
  onCancel?: () => void
}

export function CancelAppointmentDialog({
  appointment,
  onSuccess,
  onCancel,
}: CancelAppointmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const handleConfirmCancel = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Gọi API để hủy lịch khám
      await api.appointments.delete(appointment.id.toString())
      
      setIsOpen(false)
      setReason('')
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể hủy lịch khám. Vui lòng thử lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        className="gap-2 w-full sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <X className="w-4 h-4" />
        Hủy lịch khám
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xác nhận hủy lịch khám</AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <AlertDialogDescription className="space-y-4 mt-4">
            <div>
              <p className="text-foreground font-medium mb-2">
                Bạn chắc chắn muốn hủy lịch khám này?
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bác sĩ:</span>
                  <span className="font-medium text-foreground">
                    {appointment.doctor?.fullName || appointment.doctorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày khám:</span>
                  <span className="font-medium text-foreground">
                    {appointment.appointmentDate
                      ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="cancel-reason" className="text-sm font-medium mb-2 block">
                Lý do hủy (tùy chọn)
              </Label>
              <textarea
                id="cancel-reason"
                placeholder="Cho chúng tôi biết lý do hủy lịch khám..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Hành động này không thể hoàn tác. Nếu bạn muốn đặt lại lịch, vui lòng đặt lịch mới.
            </p>
          </AlertDialogDescription>

          <div className="flex gap-3 mt-6">
            <AlertDialogCancel disabled={isLoading}>Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmCancel()
              }}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
