import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'
import { doctorFeedbackService } from '@/services/doctorFeedbackService'
import type { Appointment, ServicePackageBooking } from '@/types'

function mapServicePackageStatus(status?: string) {
  const value = String(status || '').toUpperCase()
  if (value.includes('PENDING') || value.includes('UNPAID')) return 'Chờ thanh toán'
  if (value.includes('PAID')) return 'Đã thanh toán'
  if (value.includes('RECEIVED')) return 'Đã tiếp nhận'
  if (value.includes('COMPLETED')) return 'Hoàn thành'
  if (value.includes('CANCEL')) return 'Hủy'
  return 'Chờ thanh toán'
}

function servicePackageStatusClass(status?: string) {
  const normalized = mapServicePackageStatus(status)
  if (normalized === 'Đã thanh toán') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'Đã tiếp nhận') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (normalized === 'Hoàn thành') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (normalized === 'Hủy') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function isCompletedStatus(status?: string) {
  const value = String(status || '').trim().toUpperCase()
  return value === 'COMPLETED' || value === 'ĐÃ KHÁM' || value === 'DA KHAM'
}

function isCancelledStatus(status?: string) {
  const value = String(status || '').trim().toUpperCase()
  return value === 'CANCELLED' || value === 'HỦY LỊCH' || value === 'HUY LICH'
}

function appointmentStatusLabel(status?: string) {
  if (isCompletedStatus(status)) return 'Đã khám'
  if (isCancelledStatus(status)) return 'Hủy lịch'
  return 'Chờ khám'
}

function appointmentStatusClass(status?: string) {
  if (isCompletedStatus(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (isCancelledStatus(status)) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export function PatientAppointmentsPage() {
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [packageBookings, setPackageBookings] = useState<ServicePackageBooking[]>([])
  const [canFeedbackMap, setCanFeedbackMap] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const loadCanFeedbackMap = useCallback(async (items: Appointment[]) => {
    const completedAppointments = items.filter((appointment) => {
      const appointmentId = String(appointment.id || '')
      return appointmentId && isCompletedStatus(appointment.status)
    })

    if (completedAppointments.length === 0) {
      setCanFeedbackMap({})
      return
    }

    const entries = await Promise.all(
      completedAppointments.map(async (appointment) => {
        const appointmentId = String(appointment.id)
        try {
          const response = await doctorFeedbackService.canFeedback(appointmentId)
          return [appointmentId, response.canFeedback] as const
        } catch {
          return [appointmentId, false] as const
        }
      })
    )

    setCanFeedbackMap(Object.fromEntries(entries))
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [appointmentsData, packageData] = await Promise.all([
        api.appointments.getAll(),
        api.patients.getServicePackageBookings().catch(() => []),
      ])

      const nextAppointments = Array.isArray(appointmentsData) ? appointmentsData : []
      setAppointments(nextAppointments)
      setPackageBookings(Array.isArray(packageData) ? packageData : [])
      await loadCanFeedbackMap(nextAppointments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch hẹn')
    } finally {
      setLoading(false)
    }
  }, [loadCanFeedbackMap])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedDoctorName = useMemo(() => {
    if (!selectedAppointment) return 'Bác sĩ'
    return selectedAppointment.doctor?.fullName || selectedAppointment.doctorName || 'Bác sĩ'
  }, [selectedAppointment])

  const openFeedbackDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFeedbackRating(5)
    setFeedbackComment('')
    setIsFeedbackDialogOpen(true)
  }

  const submitDoctorFeedback = async () => {
    const appointmentId = String(selectedAppointment?.id || '')
    if (!appointmentId) return

    if (feedbackRating < 1 || feedbackRating > 5) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn số sao từ 1 đến 5.', variant: 'destructive' })
      return
    }

    try {
      setSubmittingFeedback(true)
      await doctorFeedbackService.create({
        appointmentId,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      })

      toast({ title: 'Thành công', description: 'Đánh giá bác sĩ thành công' })
      setIsFeedbackDialogOpen(false)
      setSelectedAppointment(null)
      await loadData()
    } catch (submitError: any) {
      toast({
        title: 'Lỗi',
        description: submitError?.message || 'Không thể gửi đánh giá bác sĩ.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lịch hẹn của tôi</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi lịch khám bác sĩ và phiếu gói dịch vụ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/service-packages">Đặt gói dịch vụ</Link>
            </Button>
            <Button asChild>
              <Link to="/booking">Đặt lịch khám</Link>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Đang tải lịch hẹn...
        </div>
      ) : error ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-destructive">
          Lỗi: {error}
        </div>
      ) : (
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Lịch khám</TabsTrigger>
            <TabsTrigger value="packages">Gói dịch vụ</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chưa có lịch khám nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã đặt lịch</p>
                        <p className="font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {appointment.medicalService?.name ?? 'Khám bệnh'}
                        </p>
                      </div>

                      <div className="space-y-2 text-right">
                        <p className="text-sm text-muted-foreground">{appointment.appointmentDate || '-'}</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                          {appointmentStatusLabel(appointment.status)}
                        </span>

                        <div className="flex items-center justify-end gap-2">
                          {isCompletedStatus(appointment.status) ? (
                            Object.prototype.hasOwnProperty.call(canFeedbackMap, String(appointment.id)) ? (
                              canFeedbackMap[String(appointment.id)] ? (
                                <Button variant="outline" size="sm" onClick={() => openFeedbackDialog(appointment)}>
                                  Đánh giá bác sĩ
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Đã đánh giá
                                </span>
                              )
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                Đang kiểm tra...
                              </span>
                            )
                          ) : null}

                          {isCancelledStatus(appointment.status) ? (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              Đã hủy
                            </span>
                          ) : null}
                        </div>

                        <Link
                          to={`/patient/appointments/${appointment.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="packages">
            {packageBookings.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chưa có phiếu gói dịch vụ nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {packageBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã phiếu dịch vụ</p>
                        <p className="font-semibold">{booking.bookingCode || `#${booking.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {booking.packageName || booking.servicePackage?.name || 'Gói dịch vụ'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {booking.bookingDate || '-'} {booking.bookingTime || ''}
                        </p>
                      </div>

                      <div className="space-y-2 text-right">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servicePackageStatusClass(
                            booking.status
                          )}`}
                        >
                          {mapServicePackageStatus(booking.status)}
                        </span>
                        {booking.amount ? (
                          <p className="text-sm font-semibold text-primary">
                            {new Intl.NumberFormat('vi-VN').format(Number(booking.amount || 0))} đ
                          </p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Đánh giá bác sĩ</DialogTitle>
            <DialogDescription>{selectedDoctorName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Số sao</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = value <= feedbackRating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackRating(value)}
                      className="rounded-md p-1 transition hover:scale-105"
                      aria-label={`Chọn ${value} sao`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Nhận xét</p>
              <Textarea
                placeholder="Bác sĩ tư vấn tận tình."
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} disabled={submittingFeedback}>
              Hủy
            </Button>
            <Button onClick={() => void submitDoctorFeedback()} disabled={submittingFeedback}>
              {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
