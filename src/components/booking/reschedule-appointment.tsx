import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { api, type ApiRequestError, type AppointmentSlot } from '@/services/api'
import type { Appointment } from '@/types'
import { formatDateDisplay, formatDateAsIso, normalizeTimeLabel } from '@/lib/date-display'

interface RescheduleAppointmentProps {
  appointment: Appointment
  onSuccess?: (newAppointment: any) => void
}

function getAppointmentDateLabel(appointment: Appointment): string {
  return formatDateDisplay(appointment.appointmentDate || appointment.date)
}

function getAppointmentTimeLabel(appointment: Appointment): string {
  const rawDateSource = String(appointment.appointmentDate || appointment.date || '').trim()
  const rawTimeSource = String(appointment.appointmentTime || appointment.time || '').trim()
  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()

  const labelTimeCandidate =
    String(appointment.appointmentTimeLabel || '')
      .trim()
      .match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|SA|CH))?$/i)?.[0] || ''

  const timeLabel = normalizeTimeLabel(rawTimeSource || embeddedTime || labelTimeCandidate)
  return timeLabel || '—'
}

export function RescheduleAppointmentDialog({
  appointment,
  onSuccess,
}: RescheduleAppointmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slotsFetchError, setSlotsFetchError] = useState<string | null>(null)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Fetch available slots when date changes
  useEffect(() => {
    const doctorId = appointment.doctorId
    if (!selectedDate || !doctorId) {
      setSlots([])
      setSlotsFetchError(null)
      return
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true)
        setSlotsFetchError(null)
        const data = await api.appointments.getDoctorSlots(doctorId, selectedDate)
        setSlots(
          (data || []).map((slot) => ({
            ...slot,
            disabled: Boolean(slot.disabled),
            full: Boolean(slot.full),
          }))
        )
      } catch (err: unknown) {
        const apiError = err as ApiRequestError
        console.error('[RescheduleAppointmentDialog] Failed to fetch doctor slots', {
          doctorId,
          inputDate: selectedDate,
          status: apiError?.status,
          body: apiError?.data,
          message: apiError?.message,
        })
        setSlotsFetchError(apiError?.message || 'Kh?ng th? t?i khung gi? kh? d?ng')
        setError(
          err instanceof Error ? err.message : 'Không thể tải khung giờ khả dụng'
        )
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    void fetchSlots()
  }, [selectedDate, appointment.doctorId])

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Vui lòng chọn ngày và giờ mới')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Call API to reschedule appointment
      const updatedAppointment = await api.appointments.reschedule(
        appointment.id.toString(),
        {
          appointmentDate: selectedTime,
        }
      )

      setIsOpen(false)
      setSelectedDate('')
      setSelectedTime('')
      setSlots([])
      setSlotsFetchError(null)
      onSuccess?.(updatedAppointment)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể đổi lịch khám. Vui lòng thử lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="gap-2 w-full sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <Calendar className="w-4 h-4" />
        Đổi lịch khám
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi lịch khám</DialogTitle>
            <DialogDescription>
              Chọn ngày và giờ mới cho cuộc khám của bạn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Appointment Info */}
            <Card className="bg-muted/50 border-muted">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-sm mb-3 text-foreground">
                  Lịch khám hiện tại
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bác sĩ:</span>
                    <span className="font-medium text-foreground">
                      {appointment.doctor?.fullName || appointment.doctorName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày:</span>
                    <span className="font-medium text-foreground">
                      {getAppointmentDateLabel(appointment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giờ:</span>
                    <span className="font-medium text-foreground">
                      {getAppointmentTimeLabel(appointment)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <div>
              <Label htmlFor="reschedule-date" className="text-sm font-semibold mb-2 block">
                Chọn ngày mới
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedTime('')
                  setError(null)
                  setSlotsFetchError(null)
                }}
                min={new Date().toISOString().split('T')[0]}
                className="text-base"
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  Chọn khung giờ
                </Label>
                {slotsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Đang tải khung giờ...</p>
                  </div>
                ) : slotsFetchError ? (
                  <div className="text-center py-8 text-destructive text-sm">
                    <p className="font-medium">{slotsFetchError}</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>Không có khung giờ khả dụng cho ngày này</p>
                    <p className="text-xs mt-2">Vui lòng chọn ngày khác</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={slot.full || slot.disabled}
                        onClick={() => setSelectedTime(slot.startTime)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedTime === slot.startTime
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/50'
                        } ${
                          slot.full || slot.disabled
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                      >
                        <div className="font-semibold">
                          {new Date(slot.startTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {slot.full ? 'Đã đầy' : `${slot.maxPatients - slot.bookedPatients} chỗ`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setSelectedDate('')
                setSelectedTime('')
                setError(null)
                setSlotsFetchError(null)
              }}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi lịch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



