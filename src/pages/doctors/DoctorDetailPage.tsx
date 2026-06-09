import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/services/api'
import { doctorFeedbackService, type DoctorFeedbackItem } from '@/services/doctorFeedbackService'
import type { Doctor } from '@/types'
import { formatDateDisplay } from '@/lib/date-display'

export function DoctorDetailPage() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<DoctorFeedbackItem[]>([])
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalFeedbacks: 0 })

  useEffect(() => {
    if (!id) return

    const fetchDoctor = async () => {
      try {
        setLoading(true)
        setFeedbackLoading(true)
        setError(null)
        setFeedbackError(null)

        const doctorData = await api.doctors.getById(id)
        setDoctor(doctorData)

        const [summaryData, feedbackData] = await Promise.all([
          doctorFeedbackService.getRatingSummary(id).catch(() => null),
          doctorFeedbackService.getFeedbacks(id).catch((feedbackFetchError: any) => {
            setFeedbackError(feedbackFetchError?.message || 'Không thể tải danh sách đánh giá bác sĩ.')
            return []
          }),
        ])

        const fallbackAverage = typeof doctorData.rating === 'number' ? doctorData.rating : 0
        const fallbackTotal = typeof doctorData.reviewCount === 'number' ? doctorData.reviewCount : 0

        setRatingSummary({
          averageRating: summaryData?.averageRating ?? fallbackAverage,
          totalFeedbacks: summaryData?.totalFeedbacks ?? fallbackTotal,
        })
        setFeedbacks(Array.isArray(feedbackData) ? feedbackData : [])
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || fetchError?.message || 'Không thể tải bác sĩ')
      } finally {
        setLoading(false)
        setFeedbackLoading(false)
      }
    }

    void fetchDoctor()
  }, [id])

  const doctorName = useMemo(
    () => doctor?.fullName ?? doctor?.name ?? 'Bác sĩ',
    [doctor]
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Đang tải thông tin bác sĩ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-destructive">
        <p>Lỗi: {error}</p>
      </div>
    )
  }

  if (!doctor) {
    return null
  }

  const doctorSpecialty =
    doctor.specialtyName ??
    (typeof doctor.specialty === 'string' ? doctor.specialty : doctor.specialty?.name) ??
    'Chưa cập nhật'

  const experienceYears = doctor.experienceYears ?? 0
  const priceValue = doctor.price ?? doctor.consultationFee ?? doctor.fee ?? 0
  const formattedPrice =
    priceValue > 0
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(priceValue)
      : 'Liên hệ'

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 text-4xl font-bold text-primary">
                  {(doctor.name ?? doctor.fullName ?? 'Bác sĩ').split(' ').pop()?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                    <span>{doctorSpecialty}</span>
                    <span>·</span>
                    <span>{experienceYears} năm kinh nghiệm</span>
                  </div>
                  <h1 className="text-3xl font-semibold">{doctorName}</h1>
                  <p className="mt-2 text-muted-foreground">{doctor.education}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Đánh giá trung bình</p>
                  <div className="mt-2 flex items-center justify-center gap-2 text-lg font-semibold">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : '0'}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{ratingSummary.totalFeedbacks} đánh giá</p>
                </div>
                <div className="rounded-3xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Phí khám</p>
                  <p className="mt-2 text-lg font-semibold">{formattedPrice}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Giới thiệu</h2>
                <p className="leading-relaxed text-muted-foreground">{doctor.bio}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Nhận xét và đánh giá</h2>
              <p className="text-sm text-muted-foreground">Phản hồi từ các bệnh nhân đã hoàn tất lịch khám với bác sĩ này.</p>

              {feedbackLoading ? (
                <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Đang tải đánh giá...</div>
              ) : feedbackError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{feedbackError}</div>
              ) : feedbacks.length === 0 ? (
                <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Chưa có đánh giá nào.</div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="rounded-3xl border p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{feedback.patientName || 'Bệnh nhân'}</p>
                          <p className="text-xs text-muted-foreground">{formatDateDisplay(feedback.createdAt)}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {feedback.rating || 0}
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{feedback.comment || 'Không có nhận xét.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Đặt lịch khám</p>
              </div>
              <p className="text-sm text-muted-foreground">Chọn ngày và giờ phù hợp với lịch khám của bác sĩ.</p>
              <Button asChild>
                <Link to={`/booking?doctor=${doctor.id}`} className="w-full text-center">
                  Đặt lịch ngay
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>Đặt lịch và nhận khuyến mãi</span>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                <p className="font-medium">Ưu đãi đặc biệt</p>
                <p className="text-muted-foreground">Đặt lịch sớm để nhận tư vấn miễn phí và thông báo lịch khám.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
