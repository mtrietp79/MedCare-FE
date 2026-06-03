import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, Package, Plus, Search, Trash2 } from 'lucide-react'
import {
  adminApi,
  type AdminServicePackage,
  type AdminServicePackageSummary,
  type AdminServicePackagePayload,
  type AdminMedicalService,
} from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeLower, safeNumber, safeString } from '@/lib/admin-normalizers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { PackageBookingsTab } from '@/components/admin/service-packages/PackageBookingsTab'

type TabType = 'bookings' | 'management'
type StatusFilterKey = 'all' | 'active' | 'inactive'
type ConfiguredFilterKey = 'all' | 'configured' | 'unconfigured'

interface PackageForm {
  name: string
  description: string
  price: string
  durationMinutes: string
  imageUrl: string
  isActive: boolean
  medicalServiceIds: string[]
}

const ITEMS_PER_PAGE = 15

const initialForm: PackageForm = {
  name: '',
  description: '',
  price: '0',
  durationMinutes: '0',
  imageUrl: '',
  isActive: true,
  medicalServiceIds: [],
}

function formatCurrencyVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function normalizeStatusFilter(value?: string): StatusFilterKey {
  const text = safeLower(value)
  if (text.includes('active') || text.includes('hoạt')) return 'active'
  if (text.includes('inactive') || text.includes('tạm') || text.includes('ngưng')) return 'inactive'
  return 'all'
}

function normalizeConfiguredFilter(value?: string): ConfiguredFilterKey {
  const text = safeLower(value)
  if (text.includes('configured') || text.includes('đã') || text.includes('cấu')) return 'configured'
  if (text.includes('unconfigured') || text.includes('chưa')) return 'unconfigured'
  return 'all'
}

function getStatusLabel(pkg: AdminServicePackage): string {
  if (pkg.isActive) return 'Đang hoạt động'
  return 'Tạm ngưng'
}

function getStatusBadgeClass(pkg: AdminServicePackage): string {
  if (pkg.isActive) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

export function AdminServicePackagesPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('bookings')

  // Package Management State
  const [packages, setPackages] = useState<AdminServicePackage[]>([])
  const [summary, setSummary] = useState<AdminServicePackageSummary>({
    totalPackages: 0,
    activePackages: 0,
    inactivePackages: 0,
    packagesWithoutItems: 0,
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all')
  const [configuredFilter, setConfiguredFilter] = useState<ConfiguredFilterKey>('all')

  const [medicalServices, setMedicalServices] = useState<AdminMedicalService[]>([])
  const [loadingServices, setLoadingServices] = useState(false)

  const [selectedPackage, setSelectedPackage] = useState<AdminServicePackage | null>(null)
  const [formData, setFormData] = useState<PackageForm>(initialForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const sortedPackages = useMemo(
    () =>
      [...packages].sort((a, b) => {
        const aTime = new Date(safeString(a.createdAt) || 0).getTime()
        const bTime = new Date(safeString(b.createdAt) || 0).getTime()
        return bTime - aTime
      }),
    [packages]
  )

  const fetchMedicalServices = async () => {
    if (medicalServices.length > 0) return

    setLoadingServices(true)
    try {
      const data = await adminApi.getMedicalServices()
      setMedicalServices(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load medical services:', err)
    } finally {
      setLoadingServices(false)
    }
  }

  const fetchPackages = async () => {
    setLoading(true)
    setError('')

    try {
      const [packagesData, summaryData] = await Promise.all([
        adminApi.getServicePackages({
          search: debouncedSearch.trim() || undefined,
          active: statusFilter === 'all' ? undefined : statusFilter === 'active',
          configured: configuredFilter === 'all' ? undefined : configuredFilter === 'configured',
        }),
        adminApi.getServicePackagesSummary().catch(() => ({
          totalPackages: 0,
          activePackages: 0,
          inactivePackages: 0,
          packagesWithoutItems: 0,
        })),
      ])

      setPackages(Array.isArray(packagesData) ? packagesData : [])
      setSummary({
        totalPackages: safeNumber(summaryData.totalPackages, 0),
        activePackages: safeNumber(summaryData.activePackages, 0),
        inactivePackages: safeNumber(summaryData.inactivePackages, 0),
        packagesWithoutItems: safeNumber(summaryData.packagesWithoutItems, 0),
      })
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách gói dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên gói dịch vụ.')
      return false
    }

    const price = safeNumber(formData.price)
    if (price === undefined || price < 0) {
      setFormError('Giá phải là số dương.')
      return false
    }

    const duration = safeNumber(formData.durationMinutes)
    if (duration === undefined || duration < 0) {
      setFormError('Thời lượng phải là số dương.')
      return false
    }

    if (formData.medicalServiceIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 dịch vụ con.')
      return false
    }

    return true
  }

  const resetForm = () => {
    setFormData(initialForm)
    setSelectedPackage(null)
    setFormError('')
    setIsFormOpen(false)
  }

  const handleStartCreate = async () => {
    await fetchMedicalServices()
    resetForm()
    setIsFormOpen(true)
  }

  const handleStartEdit = async (pkg: AdminServicePackage) => {
    await fetchMedicalServices()

    try {
      const detail = await adminApi.getServicePackage(pkg.id)
      setSelectedPackage(detail)
      setFormData({
        name: safeString(detail.name) || '',
        description: safeString(detail.description) || '',
        price: String(safeNumber(detail.price, 0)),
        durationMinutes: String(safeNumber(detail.durationMinutes, 0)),
        imageUrl: safeString(detail.imageUrl) || '',
        isActive: detail.isActive ?? true,
        medicalServiceIds: detail.medicalServiceIds || [],
      })
      setIsFormOpen(true)
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.message || 'Không thể tải chi tiết gói dịch vụ.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const payload: AdminServicePackagePayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: safeNumber(formData.price, 0) || 0,
      durationMinutes: safeNumber(formData.durationMinutes, 0) || 0,
      imageUrl: formData.imageUrl.trim() || null,
      isActive: formData.isActive,
      medicalServiceIds: formData.medicalServiceIds,
    }

    setIsSubmitting(true)
    try {
      if (selectedPackage?.id) {
        await adminApi.updateServicePackage(selectedPackage.id, payload)
        toast({ title: 'Thành công', description: 'Đã cập nhật gói dịch vụ.' })
      } else {
        await adminApi.createServicePackage(payload)
        toast({ title: 'Thành công', description: 'Đã thêm gói dịch vụ.' })
      }
      resetForm()
      await fetchPackages()
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.message || 'Không thể lưu gói dịch vụ.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (pkg: AdminServicePackage) => {
    setUpdating(true)
    try {
      const newActive = !pkg.isActive
      await adminApi.setServicePackageActive(pkg.id, newActive)
      toast({
        title: 'Thành công',
        description: newActive ? 'Đã kích hoạt gói dịch vụ.' : 'Đã tạm ngưng gói dịch vụ.',
      })
      await fetchPackages()
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.message || 'Không thể cập nhật trạng thái.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (pkg: AdminServicePackage) => {
    if (!pkg.canDelete) {
      toast({
        title: 'Không thể xóa',
        description: 'Gói dịch vụ này đã có lịch sử booking. Vui lòng dùng nút "Tạm ngưng" thay vì xóa.',
        variant: 'destructive',
      })
      return
    }

    setUpdating(true)
    try {
      const response = await adminApi.deleteServicePackage(pkg.id)
      const message =
        response?.message || 'Đã xóa gói dịch vụ.'
      toast({ title: 'Thành công', description: message })
      await fetchPackages()
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.message || 'Không thể xóa gói dịch vụ.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const renderManagementTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng gói</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPackages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary.activePackages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tạm ngưng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.inactivePackages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chưa cấu hình</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{summary.packagesWithoutItems}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách gói dịch vụ</CardTitle>
            <CardDescription>Quản lý các gói dịch vụ và liên kết dịch vụ con</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px] flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên gói, mô tả..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pl-8"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilterKey) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={configuredFilter}
                onValueChange={(value: ConfiguredFilterKey) => setConfiguredFilter(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấu hình</SelectItem>
                  <SelectItem value="configured">Đã cấu hình</SelectItem>
                  <SelectItem value="unconfigured">Chưa cấu hình</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleStartCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm gói
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedPackage ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedPackage
                        ? 'Cập nhật thông tin gói dịch vụ'
                        : 'Nhập thông tin để tạo gói dịch vụ mới.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="package-name">Tên gói</Label>
                      <Input
                        id="package-name"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="package-description">Mô tả</Label>
                      <Textarea
                        id="package-description"
                        rows={3}
                        value={formData.description}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="package-price">Giá (VND)</Label>
                        <Input
                          id="package-price"
                          type="number"
                          min={0}
                          value={formData.price}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, price: event.target.value }))
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="package-duration">Thời lượng (phút)</Label>
                        <Input
                          id="package-duration"
                          type="number"
                          min={0}
                          value={formData.durationMinutes}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              durationMinutes: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="package-image">URL ảnh</Label>
                      <Input
                        id="package-image"
                        value={formData.imageUrl}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, imageUrl: event.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="package-services">Dịch vụ con</Label>
                      <div className="space-y-2 border rounded-xl p-3 max-h-[240px] overflow-y-auto">
                        {loadingServices && (
                          <p className="text-sm text-muted-foreground">Đang tải dịch vụ...</p>
                        )}
                        {!loadingServices && medicalServices.length === 0 && (
                          <p className="text-sm text-muted-foreground">Không có dịch vụ nào.</p>
                        )}
                        {!loadingServices &&
                          medicalServices.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.medicalServiceIds.includes(service.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      medicalServiceIds: [...prev.medicalServiceIds, service.id],
                                    }))
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      medicalServiceIds: prev.medicalServiceIds.filter(
                                        (id) => id !== service.id
                                      ),
                                    }))
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{safeString(service.name)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrencyVnd(safeNumber(service.price, 0))}
                                </p>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border rounded-xl p-3">
                      <input
                        type="checkbox"
                        id="package-active"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <Label htmlFor="package-active" className="cursor-pointer">
                        Kích hoạt gói dịch vụ
                      </Label>
                    </div>

                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting ? 'Đang lưu...' : 'Lưu gói'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading && <AdminTableSkeleton rows={8} />}
            {!loading && error && (
              <AdminErrorState message={error} onRetry={() => void fetchPackages()} />
            )}
            {!loading && !error && sortedPackages.length === 0 && (
              <AdminEmptyState title="Không có gói dịch vụ phù hợp." />
            )}

            {!loading && !error && sortedPackages.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên gói</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Thời lượng</TableHead>
                      <TableHead className="text-center">Dịch vụ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-center">Booking</TableHead>
                      <TableHead className="text-center">Hoàn thành</TableHead>
                      <TableHead className="text-center">Thanh toán</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">
                          <div>{safeString(pkg.name)}</div>
                          <div className="text-xs text-muted-foreground">
                            {safeString(pkg.description) || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrencyVnd(safeNumber(pkg.price, 0))}</TableCell>
                        <TableCell>{safeNumber(pkg.durationMinutes, 0)} phút</TableCell>
                        <TableCell className="text-center">
                          {safeNumber(pkg.itemCount, 0)} dịch vụ
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full border ${getStatusBadgeClass(pkg)}`}
                          >
                            {getStatusLabel(pkg)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {safeNumber(pkg.totalBooked, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {safeNumber(pkg.totalCompleted, 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {safeNumber(pkg.totalPaid, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleStartEdit(pkg)}
                              disabled={updating}
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleToggleActive(pkg)}
                              disabled={updating}
                              title={pkg.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                            >
                              <Package className="h-4 w-4" />
                            </Button>

                            {pkg.canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xóa gói dịch vụ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc muốn xóa gói "{safeString(pkg.name)}"? Hành động này
                                      không thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => void handleDelete(pkg)}
                                    >
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initialize fetch when component mounts or filters change
  useEffect(() => {
    void fetchPackages()
  }, [statusFilter, debouncedSearch, configuredFilter])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gói dịch vụ</h1>
        <p className="text-muted-foreground">Quản lý gói dịch vụ và booking của bệnh nhân</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Booking gói
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'management'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Quản lý gói
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'bookings' && <PackageBookingsTab />}
      {activeTab === 'management' && renderManagementTab()}
    </div>
  )
}
