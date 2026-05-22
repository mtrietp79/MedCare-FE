import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '@/services/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MedicalService } from '@/types'

export function ServicesPage() {
  const [services, setServices] = useState<MedicalService[]>([])
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const debouncedKeyword = useDebouncedValue(searchInput, 400)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await api.specialties.getAll()
        setSpecialties(
          (Array.isArray(data) ? data : [])
            .map((item) => ({ id: String(item.id), name: item.name }))
            .filter((item) => item.id && item.name)
        )
      } catch {
        setSpecialties([])
      }
    }

    void loadSpecialties()
  }, [])

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)

        const query: { specialtyId?: string; q?: string } = {}
        const keyword = debouncedKeyword.trim()
        if (selectedSpecialtyId !== 'all') query.specialtyId = selectedSpecialtyId
        if (keyword) query.q = keyword

        const data = await api.medicalServices.getAll(query)
        setServices(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách dịch vụ')
      } finally {
        setLoading(false)
      }
    }

    void loadServices()
  }, [debouncedKeyword, selectedSpecialtyId])

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0)

  const selectedSpecialtyName = useMemo(
    () => specialties.find((item) => item.id === selectedSpecialtyId)?.name || 'Tất cả',
    [selectedSpecialtyId, specialties]
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dịch vụ khám bệnh</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Tìm và đặt lịch nhanh theo gói dịch vụ. Hệ thống sẽ xử lý bác sĩ phù hợp theo cấu hình của từng gói.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/booking">Đặt lịch thường</Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm gói dịch vụ..."
              className="pl-9"
            />
          </div>
          <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả chuyên khoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            Không tìm thấy dịch vụ phù hợp với bộ lọc hiện tại ({selectedSpecialtyName}).
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
                    <p className="text-sm text-muted-foreground">{service.specialty?.name || 'Chưa có chuyên khoa'}</p>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </div>

                  <CardDescription className="line-clamp-3">
                    {service.description || 'Không có mô tả.'}
                  </CardDescription>

                  <div className="rounded-xl border border-border/60 bg-muted/10 p-3 text-sm">
                    <p className="font-medium text-foreground mb-1">Bác sĩ đảm nhận</p>
                    {service.assignedDoctor ? (
                      <p className="text-muted-foreground">
                        {service.assignedDoctor.fullName || `Bác sĩ #${service.assignedDoctor.id}`}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Hệ thống sẽ tự phân bác sĩ phù hợp khi đặt lịch.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <span className="text-lg font-semibold text-primary">{formatCurrency(service.price)}</span>
                    <Badge>{service.active ? 'Đang hoạt động' : 'Không hoạt động'}</Badge>
                  </div>

                  <Button asChild className="w-full">
                    <Link
                      to={`/booking?serviceId=${service.id}`}
                      state={{ medicalService: service }}
                    >
                      Đặt lịch
                    </Link>
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


