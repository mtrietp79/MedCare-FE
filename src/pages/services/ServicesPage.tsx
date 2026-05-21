import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { MedicalService } from '@/types'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  const [services, setServices] = useState<MedicalService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.medicalServices.getAll()
        setServices(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách dịch vụ')
      } finally {
        setLoading(false)
      }
    }

    void loadServices()
  }, [])

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dịch vụ khám bệnh</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Duyệt các gói dịch vụ khám bệnh, giá cả và chuyên khoa. Chọn gói phù hợp trước khi đặt lịch.
            </p>
          </div>
          <Button asChild>
            <Link to="/booking">Đặt lịch ngay</Link>
          </Button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-border/70 bg-white p-10 text-center text-muted-foreground">
            Đang tải danh sách dịch vụ...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/70 bg-destructive/10 p-10 text-center text-destructive">
            Lỗi: {error}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-white p-10 text-center text-muted-foreground">
            Chưa có dịch vụ nào được đăng tải.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="h-52 w-full bg-slate-100 flex items-center justify-center text-muted-foreground">Không có ảnh</div>
                )}
                <CardContent className="space-y-4 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{service.specialty?.name || 'Chuyên khoa chưa có'}</p>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-3">{service.description || 'Không có mô tả.'}</CardDescription>
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <span className="text-lg font-semibold text-primary">{formatCurrency(service.price)}</span>
                    <Badge>{service.active ? 'Đang hoạt động' : 'Không hoạt động'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
