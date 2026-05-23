import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, FileText, Search, Star } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api, type PatientInvoice } from '@/services/api'
import { doctorFeedbackService } from '@/services/doctorFeedbackService'
import type { Appointment, ServicePackageBooking } from '@/types'

function mapServicePackageStatus(status?: string) {
  const value = String(status || '').toUpperCase()
  if (value.includes('PENDING') || value.includes('UNPAID')) return 'Cho thanh toan'
  if (value.includes('PAID')) return 'Da thanh toan'
  if (value.includes('RECEIVED')) return 'Da tiep nhan'
  if (value.includes('COMPLETED')) return 'Hoan thanh'
  if (value.includes('CANCEL')) return 'Huy'
  return 'Cho thanh toan'
}

function servicePackageStatusClass(status?: string) {
  const normalized = mapServicePackageStatus(status)
  if (normalized === 'Da thanh toan') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'Da tiep nhan') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (normalized === 'Hoan thanh') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (normalized === 'Huy') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function isCompletedStatus(status?: string) {
  const value = String(status || '').trim().toUpperCase()
  return value === 'COMPLETED' || value === 'DA KHAM' || value === 'ĐÃ KHÁM'
}

function isCancelledStatus(status?: string) {
  const value = String(status || '').trim().toUpperCase()
  return value === 'CANCELLED' || value === 'HUY LICH' || value === 'HỦY LỊCH'
}

function appointmentStatusLabel(status?: string) {
  if (isCompletedStatus(status)) return 'Da kham'
  if (isCancelledStatus(status)) return 'Huy lich'
  return 'Cho kham'
}

function appointmentStatusClass(status?: string) {
  if (isCompletedStatus(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (isCancelledStatus(status)) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function invoiceStatusLabel(status?: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Da thanh toan'
  if (normalized.includes('CANCEL')) return 'Da huy'
  return 'Cho thanh toan'
}

function invoiceStatusClass(status?: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized.includes('CANCEL')) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function canShowInvoicePayButton(invoice: PatientInvoice) {
  const status = String(invoice.status || '').toUpperCase()
  if (status === 'PAID') return false
  return Boolean(invoice.canPayOnline)
}

type DoctorFeedbackEligibility = 'CAN_FEEDBACK' | 'ALREADY_FEEDBACKED' | 'UNKNOWN'

export function PatientAppointmentsPage() {
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [packageBookings, setPackageBookings] = useState<ServicePackageBooking[]>([])
  const [invoices, setInvoices] = useState<PatientInvoice[]>([])
  const [canFeedbackMap, setCanFeedbackMap] = useState<Record<string, DoctorFeedbackEligibility>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceKeyword, setInvoiceKeyword] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState('all')
  const [invoicePayingId, setInvoicePayingId] = useState<string | null>(null)

  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false)
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoice | null>(null)

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
          return [appointmentId, response.canFeedback ? 'CAN_FEEDBACK' : 'ALREADY_FEEDBACKED'] as const
        } catch {
          return [appointmentId, 'UNKNOWN'] as const
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
      setError(err instanceof Error ? err.message : 'Khong the tai lich hen')
    } finally {
      setLoading(false)
    }
  }, [loadCanFeedbackMap])

  const loadInvoices = useCallback(async () => {
    try {
      setInvoiceLoading(true)
      setInvoiceError(null)
      const data = await api.patients.getMyInvoices({
        keyword: invoiceKeyword.trim() || undefined,
        status: invoiceStatus === 'all' ? undefined : invoiceStatus,
      })
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : 'Khong the tai hoa don')
    } finally {
      setInvoiceLoading(false)
    }
  }, [invoiceKeyword, invoiceStatus])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  const selectedDoctorName = useMemo(() => {
    if (!selectedAppointment) return 'Bac si'
    return selectedAppointment.doctor?.fullName || selectedAppointment.doctorName || 'Bac si'
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
      toast({ title: 'Loi', description: 'Vui long chon so sao tu 1 den 5.', variant: 'destructive' })
      return
    }

    try {
      setSubmittingFeedback(true)
      await doctorFeedbackService.create({
        appointmentId,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      })

      toast({ title: 'Thanh cong', description: 'Danh gia bac si thanh cong' })
      setIsFeedbackDialogOpen(false)
      setSelectedAppointment(null)
      await loadData()
    } catch (submitError: any) {
      toast({
        title: 'Loi',
        description: submitError?.message || 'Khong the gui danh gia bac si.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const openInvoiceDetail = async (invoice: PatientInvoice) => {
    setInvoiceDetailOpen(true)
    setInvoiceDetailLoading(true)
    try {
      let detail = await api.patients.getMyInvoiceById(invoice.id)
      if (!detail && invoice.medicalRecordId) {
        detail = await api.patients.getMyInvoiceByRecordId(invoice.medicalRecordId)
      }
      setSelectedInvoice(detail || invoice)
    } catch {
      setSelectedInvoice(invoice)
    } finally {
      setInvoiceDetailLoading(false)
    }
  }

  const payInvoiceOnline = async (invoice: PatientInvoice) => {
    try {
      setInvoicePayingId(invoice.id)
      const redirectUrl = await api.payments.createInvoicePaymentUrl(invoice.id)
      window.location.href = redirectUrl
    } catch (payError: any) {
      toast({
        title: 'Loi',
        description: payError?.message || 'Khong the khoi tao thanh toan VNPay cho hoa don.',
        variant: 'destructive',
      })
      setInvoicePayingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lich hen cua toi</h1>
            <p className="text-sm text-muted-foreground">
              Theo doi lich kham, goi dich vu, hoa don sau kham va ho so benh an.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/patient/medical-records" className="gap-2">
                <FileText className="h-4 w-4" />
                Xem ho so benh an
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/service-packages">Dat goi dich vu</Link>
            </Button>
            <Button asChild>
              <Link to="/booking">Dat lich kham</Link>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Dang tai lich hen...
        </div>
      ) : error ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-destructive">
          Loi: {error}
        </div>
      ) : (
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Lich kham</TabsTrigger>
            <TabsTrigger value="packages">Goi dich vu</TabsTrigger>
            <TabsTrigger value="invoices">Hoa don sau kham</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chua co lich kham nao.
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Ma dat lich</p>
                        <p className="font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {appointment.doctor?.fullName || appointment.doctorName || 'Bac si'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {appointment.medicalService?.name ?? 'Kham benh'}
                        </p>
                      </div>

                      <div className="space-y-2 text-right">
                        <p className="text-sm text-muted-foreground">{appointment.appointmentTimeLabel || appointment.appointmentDate || '-'}</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>
                          {appointmentStatusLabel(appointment.status)}
                        </span>

                        <div className="flex items-center justify-end gap-2">
                          {isCompletedStatus(appointment.status) ? (
                            Object.prototype.hasOwnProperty.call(canFeedbackMap, String(appointment.id)) ? (
                              canFeedbackMap[String(appointment.id)] === 'CAN_FEEDBACK' ? (
                                <Button variant="outline" size="sm" onClick={() => openFeedbackDialog(appointment)}>
                                  Danh gia bac si
                                </Button>
                              ) : canFeedbackMap[String(appointment.id)] === 'ALREADY_FEEDBACKED' ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Da danh gia
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                  Khong the kiem tra
                                </span>
                              )
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                Dang kiem tra...
                              </span>
                            )
                          ) : null}

                          {isCancelledStatus(appointment.status) ? (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                              Da huy
                            </span>
                          ) : null}
                        </div>

                        <Link
                          to={`/patient/appointments/${appointment.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Xem chi tiet
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
                Chua co phieu goi dich vu nao.
              </div>
            ) : (
              <div className="grid gap-4">
                {packageBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Ma phieu dich vu</p>
                        <p className="font-semibold">{booking.bookingCode || `#${booking.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {booking.packageName || booking.servicePackage?.name || 'Goi dich vu'}
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

          <TabsContent value="invoices">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={invoiceKeyword}
                      onChange={(event) => setInvoiceKeyword(event.target.value)}
                      placeholder="Tim theo ma hoa don..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tat ca trang thai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tat ca trang thai</SelectItem>
                      <SelectItem value="PENDING">Cho thanh toan</SelectItem>
                      <SelectItem value="PAID">Da thanh toan</SelectItem>
                      <SelectItem value="CANCELLED">Da huy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => void loadInvoices()} disabled={invoiceLoading}>
                    Tai lai
                  </Button>
                </div>

                {invoiceLoading ? (
                  <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Dang tai hoa don...</div>
                ) : invoiceError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Loi: {invoiceError}</div>
                ) : invoices.length === 0 ? (
                  <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Chua co hoa don nao.</div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-3xl border p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Hoa don</p>
                            <p className="font-semibold">{invoice.invoiceCode || `#${invoice.id}`}</p>
                            <p className="text-xs text-muted-foreground">
                              Ngay tao: {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${invoiceStatusClass(invoice.status)}`}>
                            {invoiceStatusLabel(invoice.status)}
                          </span>
                        </div>

                        <div className="mb-3 text-sm text-muted-foreground">
                          <p>
                            Tong tien:{' '}
                            <span className="font-semibold text-foreground">
                              {new Intl.NumberFormat('vi-VN').format(Number(invoice.totalAmount || 0))} đ
                            </span>
                          </p>
                          <p>Ma benh an: {invoice.medicalRecordId || '-'}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => void openInvoiceDetail(invoice)}>
                            Xem chi tiet
                          </Button>
                          {canShowInvoicePayButton(invoice) ? (
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => void payInvoiceOnline(invoice)}
                              disabled={invoicePayingId === invoice.id}
                            >
                              <CreditCard className="h-4 w-4" />
                              {invoicePayingId === invoice.id ? 'Dang chuyen huong...' : 'Thanh toan VNPay'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" disabled>
                              {String(invoice.status || '').toUpperCase() === 'PAID' ? 'Da thanh toan' : 'Khong ho tro online'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Danh gia bac si</DialogTitle>
            <DialogDescription>{selectedDoctorName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">So sao</p>
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
                      aria-label={`Chon ${value} sao`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Nhan xet</p>
              <Textarea
                placeholder="Bac si tu van tan tinh."
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} disabled={submittingFeedback}>
              Huy
            </Button>
            <Button onClick={() => void submitDoctorFeedback()} disabled={submittingFeedback}>
              {submittingFeedback ? 'Dang gui...' : 'Gui danh gia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Chi tiet hoa don</DialogTitle>
            <DialogDescription>Thong tin hoa don sau kham</DialogDescription>
          </DialogHeader>

          {invoiceDetailLoading ? (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Dang tai chi tiet...</div>
          ) : selectedInvoice ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Ma hoa don:</span> {selectedInvoice.invoiceCode || `#${selectedInvoice.id}`}</p>
              <p><span className="font-semibold">Ma benh an:</span> {selectedInvoice.medicalRecordId || '-'}</p>
              <p><span className="font-semibold">Tong tien:</span> {new Intl.NumberFormat('vi-VN').format(Number(selectedInvoice.totalAmount || 0))} đ</p>
              <p><span className="font-semibold">Trang thai:</span> {invoiceStatusLabel(selectedInvoice.status)}</p>
              <p><span className="font-semibold">Ngay tao:</span> {formatDate(selectedInvoice.createdAt)}</p>
              <p><span className="font-semibold">Ngay thanh toan:</span> {formatDate(selectedInvoice.paidAt)}</p>
              <p><span className="font-semibold">Thanh toan online:</span> {selectedInvoice.canPayOnline ? 'Co' : 'Khong'}</p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Khong co du lieu hoa don.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
