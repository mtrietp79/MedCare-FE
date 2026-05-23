import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock3, Package2, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { redirectByRole } from '@/services/auth'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type { ServicePackage } from '@/types'

export function FeaturedServices() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.servicePackages.getAll()
      setPackages(Array.isArray(data) ? data.slice(0, 6) : [])
    } catch {
      setError('Không thể tải danh sách gói dịch vụ. Vui lòng thử lại sau.')
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPackages()
  }, [loadPackages])

  const formatCurrency = (amount?: number) =>
    `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} đ`

  const handleBookNow = (pkg: ServicePackage) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'ROLE_PATIENT') {
      navigate(`/booking/service-package/${pkg.id}`)
      return
    }

    toast({
      title: 'Không thể đặt lịch',
      description: 'Chức năng này chỉ dành cho tài khoản bệnh nhân.',
      variant: 'destructive',
    })
    navigate(redirectByRole(user.role), { replace: true })
  }

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Gợi ý dịch vụ</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Các gói đặt khám phổ biến giúp bạn khám nhanh và đúng nhu cầu.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/service-packages" className="flex items-center gap-2">
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-border/70 bg-white p-6 h-72 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            <p className="text-sm md:text-base">{error}</p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => void loadPackages()}>
              Thử lại
            </Button>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-white p-8 text-center text-muted-foreground">
            Chưa có gói dịch vụ nào
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {pkg.imageUrl ? (
                  <img src={pkg.imageUrl} alt={pkg.name} className="h-44 w-full object-cover" />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 flex items-center justify-center">
                    <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                      <Package2 className="h-8 w-8 text-cyan-700" />
                    </div>
                  </div>
                )}

                <CardContent className="p-5 space-y-4">
                  <div>
                    <CardTitle className="text-xl leading-tight">{pkg.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {pkg.description || 'Chưa có mô tả cho gói dịch vụ này.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <WalletCards className="h-4 w-4" />
                        Giá
                      </span>
                      <span className="font-semibold text-cyan-700">{formatCurrency(pkg.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        Thời lượng
                      </span>
                      <span className="font-medium text-foreground">
                        {pkg.durationMinutes ? `${pkg.durationMinutes} phút` : 'Đang cập nhật'}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e]" onClick={() => handleBookNow(pkg)}>
                    Đặt lịch
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
