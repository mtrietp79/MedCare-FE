import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react'
import {
  adminApi,
  type AdminMedicine,
  type AdminMedicinePayload,
  type AdminMedicineSummary,
} from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { safeNumber, safeString } from '@/lib/admin-normalizers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

type MedicineStatusKey = 'in_stock' | 'low_stock' | 'out_of_stock' | 'other'

interface MedicineForm {
  name: string
  category: string
  manufacturer: string
  quantity: string
  unit: string
  price: string
  dosage: string
  expiryDate: string
  description: string
}

const ITEMS_PER_PAGE = 15
const unitOptions = ['viên', 'tuýp', 'chai', 'lọ', 'gói', 'ống', 'miếng']

const initialForm: MedicineForm = {
  name: '',
  category: '',
  manufacturer: '',
  quantity: '0',
  unit: 'viên',
  price: '0',
  dosage: '',
  expiryDate: '',
  description: '',
}

const initialSummary: AdminMedicineSummary = {
  lowStockCount: 0,
  expiredCount: 0,
}

function normalizeVietnameseText(value: string): string {
  return safeString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function statusToKey(status: string): MedicineStatusKey {
  const normalized = normalizeVietnameseText(status)

  if (normalized === 'con hang' || normalized === 'available' || normalized === 'in_stock') {
    return 'in_stock'
  }

  if (normalized === 'sap het' || normalized === 'low_stock') {
    return 'low_stock'
  }

  if (normalized === 'het hang' || normalized === 'out_of_stock') {
    return 'out_of_stock'
  }

  return 'other'
}

function formatCurrencyVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function normalizeDateToYmd(value?: string | null): string {
  const source = safeString(value)
  if (!source) return ''

  const ymd = source.match(/^\d{4}-\d{2}-\d{2}/)
  if (ymd) return ymd[0]

  const dmy = source.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`

  const parsed = new Date(source)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDmy(value?: string | null): string {
  const ymd = normalizeDateToYmd(value)
  if (!ymd) return '-'

  const [year, month, day] = ymd.split('-')
  return `${day}-${month}-${year}`
}

function getQuantityBadgeClass(status: string): string {
  const key = statusToKey(status)
  if (key === 'out_of_stock') return 'bg-red-50 text-red-700 border-red-200'
  if (key === 'low_stock') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-800 border-slate-200'
}

function getStatusBadgeClass(status: string): string {
  const key = statusToKey(status)
  if (key === 'in_stock') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (key === 'low_stock') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (key === 'out_of_stock') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export function AdminMedicinesPage() {
  const { toast } = useToast()

  const [medicines, setMedicines] = useState<AdminMedicine[]>([])
  const [summary, setSummary] = useState<AdminMedicineSummary>(initialSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedMedicine, setSelectedMedicine] = useState<AdminMedicine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<MedicineForm>(initialForm)
  const [formError, setFormError] = useState('')

  const fetchPageData = async () => {
    setLoading(true)
    setError('')

    try {
      const [medicinesResult, summaryResult] = await Promise.allSettled([
        adminApi.getMedicines(),
        adminApi.getMedicinesSummary(),
      ])

      if (medicinesResult.status === 'rejected') {
        throw medicinesResult.reason
      }

      setMedicines(Array.isArray(medicinesResult.value) ? medicinesResult.value : [])

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setSummary({
          lowStockCount: safeNumber(summaryResult.value.lowStockCount, 0),
          expiredCount: safeNumber(summaryResult.value.expiredCount, 0),
        })
      } else {
        setSummary(initialSummary)
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách thuốc.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPageData()
  }, [])

  const sortedMedicines = useMemo(
    () => [...medicines].sort((a, b) => safeString(a.name).localeCompare(safeString(b.name), 'vi')),
    [medicines]
  )

  const totalPages = Math.max(1, Math.ceil(sortedMedicines.length / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedMedicines.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedMedicines, currentPage])

  const resetForm = () => {
    setFormData(initialForm)
    setFormError('')
    setSelectedMedicine(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Tên thuốc là bắt buộc.')
      return false
    }

    if (Number(formData.quantity) < 0 || Number(formData.price) < 0) {
      setFormError('Số lượng và giá phải lớn hơn hoặc bằng 0.')
      return false
    }

    setFormError('')
    return true
  }

  const payloadFromForm = (form: MedicineForm): AdminMedicinePayload => ({
    name: form.name.trim(),
    category: form.category.trim() || null,
    manufacturer: form.manufacturer.trim() || null,
    quantity: Number(form.quantity) || 0,
    unit: form.unit || null,
    price: Number(form.price) || 0,
    dosage: form.dosage.trim() || null,
    expiryDate: form.expiryDate || null,
    expirationDate: form.expiryDate || null,
    description: form.description.trim() || null,
  })

  const openEditDialog = (medicine: AdminMedicine) => {
    setSelectedMedicine(medicine)
    const inputDate = normalizeDateToYmd(medicine.expiryDate ?? medicine.expirationDate)

    setFormData({
      name: safeString(medicine.name),
      category: safeString(medicine.category),
      manufacturer: safeString(medicine.manufacturer),
      quantity: String(safeNumber(medicine.quantity, 0)),
      unit: safeString(medicine.unit) || 'viên',
      price: String(safeNumber(medicine.price, 0)),
      dosage: safeString(medicine.dosage),
      expiryDate: inputDate,
      description: safeString(medicine.description),
    })
    setFormError('')
    setIsEditDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.createMedicine(payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã thêm thuốc mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchPageData()
    } catch (createError: any) {
      toast({
        title: 'Lỗi',
        description: createError?.message || 'Không thể thêm thuốc.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedMedicine?.id) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.updateMedicine(String(selectedMedicine.id), payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã cập nhật thuốc.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchPageData()
    } catch (updateError: any) {
      toast({
        title: 'Lỗi',
        description: updateError?.message || 'Không thể cập nhật thuốc.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteMedicine(id)
      toast({ title: 'Thành công', description: 'Đã xóa thuốc.' })
      await fetchPageData()
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa thuốc.',
        variant: 'destructive',
      })
    }
  }

  const renderForm = () => (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="medicine-name">Tên thuốc</Label>
        <Input
          id="medicine-name"
          value={formData.name}
          onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="medicine-category">Danh mục</Label>
          <Input
            id="medicine-category"
            value={formData.category}
            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="medicine-manufacturer">Nhà sản xuất</Label>
          <Input
            id="medicine-manufacturer"
            value={formData.manufacturer}
            onChange={(event) => setFormData((prev) => ({ ...prev, manufacturer: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="medicine-quantity">Số lượng</Label>
          <Input
            id="medicine-quantity"
            type="number"
            min={0}
            value={formData.quantity}
            onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="medicine-unit">Đơn vị</Label>
          <Select value={formData.unit} onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}>
            <SelectTrigger id="medicine-unit">
              <SelectValue placeholder="Chọn đơn vị" />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="medicine-price">Giá (VND)</Label>
          <Input
            id="medicine-price"
            type="number"
            min={0}
            value={formData.price}
            onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="medicine-expiry">Hạn sử dụng</Label>
          <Input
            id="medicine-expiry"
            type="date"
            value={formData.expiryDate}
            onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="medicine-dosage">Liều lượng</Label>
        <Input
          id="medicine-dosage"
          value={formData.dosage}
          onChange={(event) => setFormData((prev) => ({ ...prev, dosage: event.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="medicine-description">Mô tả</Label>
        <Textarea
          id="medicine-description"
          rows={4}
          value={formData.description}
          onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  )

  return (
    <div className="min-h-full space-y-6 bg-slate-50/60 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý thuốc</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý kho thuốc và thông tin chi tiết các loại thuốc
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm thuốc
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Thêm thuốc</DialogTitle>
              <DialogDescription>Nhập thông tin để thêm thuốc mới vào kho.</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Đang lưu...' : 'Lưu thuốc'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {safeNumber(summary.lowStockCount, 0)} loại thuốc sắp hết hàng
              </p>
              <p className="text-sm text-amber-700">Vui lòng cập nhật tồn kho</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                {safeNumber(summary.expiredCount, 0)} loại thuốc đã hết hạn
              </p>
              <p className="text-sm text-red-700">Cần loại bỏ ngay lập tức</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          {loading && (
            <div className="p-4">
              <AdminTableSkeleton rows={8} />
            </div>
          )}

          {!loading && error && (
            <div className="p-4">
              <AdminErrorState message={error} onRetry={() => void fetchPageData()} />
            </div>
          )}

          {!loading && !error && sortedMedicines.length === 0 && (
            <div className="p-6">
              <AdminEmptyState title="Chưa có dữ liệu thuốc." />
            </div>
          )}

          {!loading && !error && sortedMedicines.length > 0 && (
            <>
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="px-6 py-4">Tên thuốc</TableHead>
                    <TableHead className="px-6 py-4">Danh mục</TableHead>
                    <TableHead className="px-6 py-4">Nhà sản xuất</TableHead>
                    <TableHead className="px-6 py-4">Tồn kho</TableHead>
                    <TableHead className="px-6 py-4">Giá</TableHead>
                    <TableHead className="px-6 py-4">Hạn sử dụng</TableHead>
                    <TableHead className="px-6 py-4">Trạng thái</TableHead>
                    <TableHead className="px-6 py-4 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMedicines.map((medicine) => {
                    const statusText = safeString(medicine.status) || 'Không xác định'
                    const expiryText = formatDateDmy(medicine.expiryDate ?? medicine.expirationDate)

                    return (
                      <TableRow key={String(medicine.id)} className="border-b border-slate-100">
                        <TableCell className="px-6 py-4 font-semibold text-slate-900">{safeString(medicine.name) || '-'}</TableCell>
                        <TableCell className="px-6 py-4">{safeString(medicine.category) || '-'}</TableCell>
                        <TableCell className="px-6 py-4">{safeString(medicine.manufacturer) || '-'}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={`rounded-full border font-medium ${getQuantityBadgeClass(statusText)}`}>
                            {safeNumber(medicine.quantity, 0)} {safeString(medicine.unit)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">{formatCurrencyVnd(safeNumber(medicine.price, 0))}</TableCell>
                        <TableCell className={`px-6 py-4 ${medicine.expired ? 'text-red-600' : ''}`}>
                          {expiryText}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={`rounded-full border font-medium ${getStatusBadgeClass(statusText)}`}>
                            {statusText}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg"
                              onClick={() => openEditDialog(medicine)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa thuốc</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc muốn xóa thuốc {safeString(medicine.name) || String(medicine.id)}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => void handleDelete(String(medicine.id))}>
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="min-w-[92px] text-center text-sm font-semibold text-slate-700">
                    Trang {currentPage}/{totalPages}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thuốc</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin thuốc và tồn kho.</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


