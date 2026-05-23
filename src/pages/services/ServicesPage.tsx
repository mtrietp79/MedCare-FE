import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock3, Package2, Search, WalletCards } from 'lucide-react'
import { api } from '@/services/api'
import type { ServicePackage } from '@/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { redirectByRole } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function ServicesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [searchInput, setSearchInput] = useState('')
  const debouncedKeyword = useDebouncedValue(searchInput, 400)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPackages = useCallback(async (keyword = '') => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.servicePackages.getAll({ q: keyword.trim() || undefined })
      setPackages(Array.isArray(data) ? data : [])
    } catch {
      setPackages([])
      setError('Không thể tải danh sách gói dịch vụ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPackages(debouncedKeyword)
  }, [debouncedKeyword, loadPackages])

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
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Gói dịch vụ đặt khám</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Chọn gói phù hợp để đặt lịch nhanh. Thời gian và chi phí được hiển thị rõ ràng.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/booking">Đặt lịch thường</Link>
          </Button>
        </div>

        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm gói dịch vụ..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-border/70 bg-white p-10 text-center text-muted-foreground">
            Đang tải danh sách gói dịch vụ...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p>{error}</p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => void loadPackages(debouncedKeyword)}>
              Thử lại
            </Button>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-white p-10 text-center text-muted-foreground">
            Chưa có gói dịch vụ nào
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {pkg.imageUrl ? (
                  <img src={pkg.imageUrl} alt={pkg.name} className="h-52 w-full object-cover" />
                ) : (
                  <div className="h-52 w-full bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 flex items-center justify-center">
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                      <Package2 className="h-9 w-9 text-cyan-700" />
                    </div>
                  </div>
                )}

                <CardContent className="space-y-4 p-6">
                  <div>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {pkg.description || 'Chưa có mô tả cho gói dịch vụ này.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <WalletCards className="h-4 w-4" />
                        Giá
                      </span>
                      <span className="font-semibold text-primary">{formatCurrency(pkg.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
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
    </div>
  )
}
