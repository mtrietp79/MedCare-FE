import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Clock3, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { redirectByRole } from '@/services/auth'
import type { ServicePackage } from '@/types'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const TIME_SLOTS = Array.from({ length: 11 }, (_, index) => {
  const hour = 7 + index
  return `${String(hour).padStart(2, '0')}:00`
})

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateTime(dateValue: string, timeValue: string): Date | null {
  const date = parseDateInput(dateValue)
  if (!date || !timeValue) return null

  const [hourRaw, minuteRaw] = timeValue.split(':').map(Number)
  if (!Number.isFinite(hourRaw) || !Number.isFinite(minuteRaw)) return null

  date.setHours(hourRaw, minuteRaw, 0, 0)
  return date
}

function formatNowLabel(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${hh}:${mm} - ${dd}/${mo}/${yyyy}`
}

function formatDateDisplay(value: string) {
  const parsed = parseDateInput(value)
  if (!parsed) return ''
  return parsed.toLocaleDateString('vi-VN')
}

function formatDateAsIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ServicePackageBookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [pkg, setPkg] = useState<ServicePackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [note, setNote] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const formatCurrency = (amount?: number) =>
    `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} đ`

  const todayMinDate = useMemo(() => {
    const year = currentTime.getFullYear()
    const month = String(currentTime.getMonth() + 1).padStart(2, '0')
    const day = String(currentTime.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [currentTime])

  const minSelectableDate = useMemo(() => {
    const date = parseDateInput(todayMinDate) ?? new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [todayMinDate])

  const minAllowedDateTime = useMemo(() => {
    return new Date(currentTime.getTime() + 60 * 60 * 1000)
  }, [currentTime])

  const bookingValidationMessage = useMemo(() => {
    if (!bookingDate || !bookingTime) return null
    const selectedDateTime = toDateTime(bookingDate, bookingTime)
    if (!selectedDateTime) return 'Thời gian không hợp lệ.'

    if (selectedDateTime.getTime() < minAllowedDateTime.getTime()) {
      return 'Vui lòng chọn lịch hẹn cách thời điểm hiện tại tối thiểu 1 tiếng.'
    }

    return null
  }, [bookingDate, bookingTime, minAllowedDateTime])

  const isFormValid = useMemo(() => {
    return Boolean(pkg?.id && bookingDate && bookingTime && !bookingValidationMessage)
  }, [bookingDate, bookingTime, bookingValidationMessage, pkg?.id])

  const availableTimeSlots = useMemo(() => {
    const selectedDate = parseDateInput(bookingDate)
    if (!selectedDate) {
      return TIME_SLOTS.map((value) => ({ value, disabled: false }))
    }

    return TIME_SLOTS.map((value) => {
      const candidateDateTime = toDateTime(bookingDate, value)
      const disabled = !candidateDateTime || candidateDateTime.getTime() < minAllowedDateTime.getTime()
      return { value, disabled }
    })
  }, [bookingDate, minAllowedDateTime])

  const loadData = useCallback(async () => {
    if (!id) {
      setError('Không tìm thấy gói dịch vụ.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const packageData = await api.servicePackages.getById(id)

      if (!packageData) {
        setError('Không tìm thấy gói dịch vụ.')
        setPkg(null)
      } else {
        setPkg(packageData)
      }
    } catch {
      setError('Không thể tải thông tin gói dịch vụ. Vui lòng thử lại sau.')
      setPkg(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (user.role !== 'ROLE_PATIENT') {
      toast({
        title: 'Bạn không có quyền truy cập',
        description: 'Chỉ tài khoản bệnh nhân mới được đặt lịch gói dịch vụ.',
        variant: 'destructive',
      })
      navigate(redirectByRole(user.role), { replace: true })
      return
    }

    void loadData()
  }, [authLoading, loadData, navigate, toast, user])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!bookingTime) return
    const selected = availableTimeSlots.find((slot) => slot.value === bookingTime)
    if (selected?.disabled) {
      setBookingTime('')
    }
  }, [availableTimeSlots, bookingTime])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pkg?.id || !isFormValid || submitting) return

    if (bookingValidationMessage) {
      toast({
        title: 'Thời gian chưa hợp lệ',
        description: bookingValidationMessage,
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await api.patients.createServicePackageBooking({
        packageId: Number(pkg.id),
        bookingDate,
        bookingTime,
        note: note.trim() || undefined,
      })

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl
        return
      }

      toast({
        title: 'Đặt lịch thành công',
        description: 'Lịch hẹn đã được tạo. Bạn có thể xem trong lịch hẹn của tôi.',
      })
      navigate('/patient/appointments', { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Không thể tạo lịch hẹn. Vui lòng thử lại sau.'
      toast({
        title: 'Đặt lịch thất bại',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải dữ liệu...
        </div>
      </div>
    )
  }

  if (error || !pkg) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <p className="text-amber-900">{error || 'Không tìm thấy gói dịch vụ.'}</p>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={() => void loadData()}>
                Thử lại
              </Button>
              <Button asChild>
                <Link to="/service-packages">Quay lại danh sách gói</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Đặt lịch gói dịch vụ</h1>
          <p className="mt-2 text-muted-foreground">Hoàn tất thông tin lịch hẹn và thanh toán VNPay.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-3xl border border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle>Gói dịch vụ đã chọn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-lg font-semibold text-foreground">{pkg.name}</p>
              <p className="text-muted-foreground">{pkg.description || 'Chưa có mô tả.'}</p>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Giá</span>
                  <span className="font-semibold text-primary">{formatCurrency(pkg.price)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thời lượng</span>
                  <span className="font-medium">
                    {pkg.durationMinutes ? `${pkg.durationMinutes} phút` : 'Đang cập nhật'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin lịch hẹn</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 text-sm text-sky-700">
                  <p className="flex items-center gap-2 font-medium">
                    <Clock3 className="h-4 w-4" />
                    Khung giờ nhận khách: 07:00 - 17:00
                  </p>
                  <p className="mt-1 text-xs">
                    Thời gian hiện tại: {formatNowLabel(currentTime)}. Vui lòng đặt lịch trước ít nhất 1 tiếng.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bookingDate" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      Ngày đến cơ sở
                    </Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="bookingDate"
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between px-4 text-base font-normal"
                        >
                          {bookingDate ? (
                            <span>{formatDateDisplay(bookingDate)}</span>
                          ) : (
                            <span className="text-muted-foreground">Chọn ngày đến cơ sở</span>
                          )}
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateInput(bookingDate) ?? undefined}
                          onSelect={(date) => {
                            if (!date) return
                            if (date < minSelectableDate) return
                            setBookingDate(formatDateAsIso(date))
                            setBookingTime('')
                            setIsDatePickerOpen(false)
                          }}
                          disabled={(date) => date < minSelectableDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingTime" className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      Giờ đến cơ sở
                    </Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          disabled={slot.disabled || !bookingDate}
                          onClick={() => setBookingTime(slot.value)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-sm font-medium transition',
                            bookingTime === slot.value
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700',
                            (slot.disabled || !bookingDate) &&
                              'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-100 hover:text-slate-400'
                          )}
                        >
                          {slot.value}
                        </button>
                      ))}
                    </div>
                    <input id="bookingTime" name="bookingTime" type="hidden" value={bookingTime} required />
                    {!bookingDate ? (
                      <p className="text-xs text-muted-foreground">Vui lòng chọn ngày trước để mở danh sách giờ.</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    rows={4}
                    placeholder="Ví dụ: Tôi muốn khám tổng quát định kỳ"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>

                {bookingValidationMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {bookingValidationMessage}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className="bg-[#0d9488] px-5 hover:bg-[#0f766e]"
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận và thanh toán'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/service-packages">Hủy</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
