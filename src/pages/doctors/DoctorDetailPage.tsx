import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, MessageCircle, CalendarCheck, CurrencyDong } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/services/api'
import type { Doctor } from '@/types'

export function DoctorDetailPage() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchDoctor = async () => {
      try {
        setLoading(true)
        const data = await api.doctors.getById(id)
        setDoctor(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải bác sĩ')
      } finally {
        setLoading(false)
      }
    }
    fetchDoctor()
  }, [id])

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

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                  {doctor.name.split(' ').pop()?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-primary font-semibold">
                    <span>{doctor.specialty}</span>
                    <span>·</span>
                    <span>{doctor.experience} năm kinh nghiệm</span>
                  </div>
                  <h1 className="text-3xl font-semibold">{doctor.name}</h1>
                  <p className="text-muted-foreground mt-2">{doctor.education}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Đánh giá</p>
                  <div className="mt-2 flex items-center justify-center gap-2 text-lg font-semibold">
                    <Star className="w-4 h-4 text-yellow-500" /> {doctor.rating}
                  </div>
                </div>
                <div className="rounded-3xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Bệnh nhân</p>
                  <p className="mt-2 text-lg font-semibold">{doctor.reviewCount}</p>
                </div>
                <div className="rounded-3xl border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Phí khám</p>
                  <p className="mt-2 text-lg font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor.consultationFee)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Giới thiệu</h2>
                  <p className="text-muted-foreground leading-relaxed">{doctor.bio}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border p-4">
                    <p className="text-sm text-muted-foreground">Cơ sở</p>
                    <p className="mt-2 font-medium">{doctor.hospital}</p>
                  </div>
                  <div className="rounded-3xl border p-4">
                    <p className="text-sm text-muted-foreground">Ngôn ngữ</p>
                    <p className="mt-2 font-medium">{doctor.languages.join(', ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Nhận xét & đánh giá</h2>
              <p className="text-sm text-muted-foreground">Xem đánh giá từ các bệnh nhân đã từng khám bác sĩ này.</p>
              <div className="grid gap-3">
                <div className="rounded-3xl border p-4">
                  <p className="text-sm font-medium">Phản hồi nhanh chóng</p>
                  <p className="text-muted-foreground mt-1">Bác sĩ trả lời rõ ràng, tận tâm.</p>
                </div>
                <div className="rounded-3xl border p-4">
                  <p className="text-sm font-medium">Kinh nghiệm chuyên sâu</p>
                  <p className="text-muted-foreground mt-1">Bác sĩ có nhiều ca điều trị thành công.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-primary" />
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
                <MessageCircle className="w-4 h-4" />
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
