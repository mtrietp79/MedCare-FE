import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/services/api'
import type { MedicalService } from '@/types'

export function FeaturedServices() {
  const [services, setServices] = useState<MedicalService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.medicalServices.getAll()
        const activeServices = Array.isArray(data) ? data.filter((item) => item.active !== false) : []
        setServices(activeServices.slice(0, 4))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dịch vụ nổi bật')
      } finally {
        setLoading(false)
      }
    }

    void loadServices()
  }, [])

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0)

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Gợi ý dịch vụ</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">Những gói dịch vụ phổ biến, phù hợp để bạn cân nhắc trước khi đặt lịch.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services" className="flex items-center gap-2">
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-border/70 bg-white p-6 h-80 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/70 bg-destructive/10 p-10 text-center text-destructive">
            Lỗi: {error}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-white p-10 text-center text-muted-foreground">Hiện chưa có dịch vụ nổi bật.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt={service.name} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-sm text-muted-foreground">Không có ảnh</div>
                )}
                <CardContent className="p-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{service.specialty?.name || 'Chuyên khoa'}</p>
                    <CardTitle className="text-xl leading-tight">{service.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{service.description || 'Mô tả dịch vụ không có sẵn.'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">{formatCurrency(service.price)}</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{service.active ? 'Đang hoạt động' : 'Tạm ngưng'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
