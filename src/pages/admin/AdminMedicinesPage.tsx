import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, Plus, Search, Tags, Trash2 } from 'lucide-react'
import {
  adminApi,
  type AdminMedicine,
  type AdminMedicineCategory,
  type AdminMedicineCategoryPayload,
  type AdminMedicinePayload,
  type AdminMedicineSummary,
} from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeLower, safeNumber, safeString } from '@/lib/admin-normalizers'
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

type MedicineStatusKey = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'other'

interface MedicineForm {
  name: string
  medicineCategoryId: string
  manufacturer: string
  quantity: string
  unit: string
  price: string
  dosage: string
  expiryDate: string
  description: string
}

interface MedicineCategoryForm {
  name: string
  description: string
}

const ITEMS_PER_PAGE = 15
const FILTER_ALL = 'all'
const unitOptions = ['viên', 'tuýp', 'chai', 'lọ', 'gói', 'ống', 'miếng']

const initialForm: MedicineForm = {
  name: '',
  medicineCategoryId: '',
  manufacturer: '',
  quantity: '0',
  unit: 'viên',
  price: '0',
  dosage: '',
  expiryDate: '',
  description: '',
}

const initialCategoryForm: MedicineCategoryForm = {
  name: '',
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

function statusToKey(status: string, quantity?: number): MedicineStatusKey {
  const normalized = normalizeVietnameseText(status)

  if (normalized === 'expired' || normalized === 'het han') {
    return 'expired'
  }

  const numericQuantity = Number(quantity)
  if (Number.isFinite(numericQuantity) && numericQuantity <= 0) {
    return 'out_of_stock'
  }

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

function getQuantityBadgeClass(status: string, quantity?: number): string {
  const key = statusToKey(status, quantity)
  if (key === 'out_of_stock') return 'bg-red-50 text-red-700 border-red-200'
  if (key === 'low_stock') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-800 border-slate-200'
}

function getStatusBadgeClass(status: string, quantity?: number): string {
  const key = statusToKey(status, quantity)
  if (key === 'in_stock') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (key === 'low_stock') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (key === 'out_of_stock' || key === 'expired') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function getStatusLabel(status: string, quantity?: number): string {
  const key = statusToKey(status, quantity)
  if (key === 'expired') return 'Hết hạn'
  if (key === 'out_of_stock') return 'Hết hàng'
  if (key === 'low_stock') return 'Sắp hết'
  if (key === 'in_stock') return 'Còn hàng'
  return safeString(status) || 'Không xác định'
}

function getCategoryLabel(category?: AdminMedicineCategory | null): string {
  const name = safeString(category?.name)
  if (name) return name
  const id = safeString(category?.id)
  return id ? `Danh mục #${id}` : 'Danh mục'
}

export function AdminMedicinesPage() {
  const { toast } = useToast()

  const [medicines, setMedicines] = useState<AdminMedicine[]>([])
  const [medicineCategories, setMedicineCategories] = useState<AdminMedicineCategory[]>([])
  const [summary, setSummary] = useState<AdminMedicineSummary>(initialSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [medicineCategoriesLoading, setMedicineCategoriesLoading] = useState(true)
  const [medicineCategoriesError, setMedicineCategoriesError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL)
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL)

  const [selectedMedicine, setSelectedMedicine] = useState<AdminMedicine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<MedicineForm>(initialForm)
  const [formError, setFormError] = useState('')

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AdminMedicineCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState<MedicineCategoryForm>(initialCategoryForm)
  const [categoryFormError, setCategoryFormError] = useState('')
  const [categoryDetailLoadingId, setCategoryDetailLoadingId] = useState<string | null>(null)

  const sortedMedicineCategories = useMemo(
    () => [...medicineCategories].sort((a, b) => safeString(a.name).localeCompare(safeString(b.name), 'vi')),
    [medicineCategories]
  )

  const statusOptions = useMemo(() => {
    const optionMap = new Map<string, string>()

    medicines.forEach((medicine) => {
      const statusValue = safeString(medicine.status)
      if (!statusValue) return
      optionMap.set(statusValue, getStatusLabel(statusValue, safeNumber(medicine.quantity, 0)))
    })

    if (statusFilter !== FILTER_ALL && !optionMap.has(statusFilter)) {
      optionMap.set(statusFilter, getStatusLabel(statusFilter))
    }

    return Array.from(optionMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  }, [medicines, statusFilter])

  const fetchSummary = async () => {
    try {
      const summaryResult = await adminApi.getMedicinesSummary()
      setSummary({
        lowStockCount: safeNumber(summaryResult.lowStockCount, 0),
        expiredCount: safeNumber(summaryResult.expiredCount, 0),
      })
    } catch {
      setSummary(initialSummary)
    }
  }

  const fetchMedicineCategories = async (showLoading = true) => {
    if (showLoading) {
      setMedicineCategoriesLoading(true)
    }
    setMedicineCategoriesError('')

    try {
      const categoriesData = await adminApi.getMedicineCategories()
      setMedicineCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (fetchError: any) {
      setMedicineCategoriesError(fetchError?.message || 'Không thể tải danh mục thuốc.')
    } finally {
      if (showLoading) {
        setMedicineCategoriesLoading(false)
      }
    }
  }

  const fetchMedicines = async (
    query: {
      keyword?: string
      categoryId?: string
      status?: string
    } = {
      keyword: debouncedSearch,
      categoryId: categoryFilter,
      status: statusFilter,
    }
  ) => {
    setLoading(true)
    setError('')

    try {
      const medicinesData = await adminApi.getMedicines({
        keyword: query.keyword?.trim() || undefined,
        categoryId: query.categoryId === FILTER_ALL ? undefined : query.categoryId,
        status: query.status === FILTER_ALL ? undefined : query.status,
      })
      setMedicines(Array.isArray(medicinesData) ? medicinesData : [])
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách thuốc.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMedicineCategories()
    void fetchSummary()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, categoryFilter, statusFilter])

  useEffect(() => {
    void fetchMedicines()
  }, [debouncedSearch, categoryFilter, statusFilter])

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

    const categoryId = Number(formData.medicineCategoryId)
    if (!formData.medicineCategoryId || !Number.isFinite(categoryId) || categoryId <= 0) {
      setFormError('Danh mục thuốc là bắt buộc.')
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
    manufacturer: form.manufacturer.trim() || null,
    quantity: Number(form.quantity) || 0,
    unit: form.unit || null,
    price: Number(form.price) || 0,
    dosage: form.dosage.trim() || null,
    expiryDate: form.expiryDate || null,
    description: form.description.trim() || null,
    medicineCategoryId: Number(form.medicineCategoryId),
  })

  const resetCategoryForm = () => {
    setSelectedCategory(null)
    setCategoryFormData(initialCategoryForm)
    setCategoryFormError('')
  }

  const validateCategoryForm = () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormError('Tên danh mục là bắt buộc.')
      return false
    }

    setCategoryFormError('')
    return true
  }

  const openEditDialog = (medicine: AdminMedicine) => {
    setSelectedMedicine(medicine)
    const inputDate = normalizeDateToYmd(medicine.expiryDate ?? medicine.expirationDate)
    const matchedCategoryId = safeString(medicine.medicineCategoryId)
      || sortedMedicineCategories.find(
        (category) => safeLower(category.name) === safeLower(medicine.medicineCategoryName)
      )?.id
      || ''

    setFormData({
      name: safeString(medicine.name),
      medicineCategoryId: matchedCategoryId,
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
      await Promise.all([fetchMedicines(), fetchSummary()])
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
      await Promise.all([fetchMedicines(), fetchSummary()])
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
      await Promise.all([fetchMedicines(), fetchSummary()])
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa thuốc.',
        variant: 'destructive',
      })
    }
  }

  const handleStartEditCategory = async (id: string) => {
    setCategoryDetailLoadingId(id)
    setCategoryFormError('')

    try {
      const category = await adminApi.getMedicineCategory(id)
      setSelectedCategory(category)
      setCategoryFormData({
        name: safeString(category.name),
        description: safeString(category.description),
      })
    } catch (categoryError: any) {
      toast({
        title: 'Lỗi',
        description: categoryError?.message || 'Không thể tải chi tiết danh mục.',
        variant: 'destructive',
      })
    } finally {
      setCategoryDetailLoadingId(null)
    }
  }

  const handleSaveCategory = async () => {
    if (!validateCategoryForm()) return

    const payload: AdminMedicineCategoryPayload = {
      name: categoryFormData.name.trim(),
      description: categoryFormData.description.trim() || null,
    }

    setIsCategorySubmitting(true)
    try {
      if (selectedCategory?.id) {
        await adminApi.updateMedicineCategory(selectedCategory.id, payload)
        toast({ title: 'Thành công', description: 'Đã cập nhật danh mục thuốc.' })
      } else {
        await adminApi.createMedicineCategory(payload)
        toast({ title: 'Thành công', description: 'Đã thêm danh mục thuốc.' })
      }

      resetCategoryForm()
      await Promise.all([
        fetchMedicineCategories(false),
        fetchMedicines(),
      ])
    } catch (categoryError: any) {
      toast({
        title: 'Lỗi',
        description: categoryError?.message || 'Không thể lưu danh mục thuốc.',
        variant: 'destructive',
      })
    } finally {
      setIsCategorySubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const nextCategoryFilter = categoryFilter === id ? FILTER_ALL : categoryFilter

    try {
      await adminApi.deleteMedicineCategory(id)

      if (formData.medicineCategoryId === id) {
        setFormData((prev) => ({ ...prev, medicineCategoryId: '' }))
      }
      if (selectedCategory?.id === id) {
        resetCategoryForm()
      }
      if (nextCategoryFilter !== categoryFilter) {
        setCategoryFilter(nextCategoryFilter)
      }

      toast({ title: 'Thành công', description: 'Đã xóa danh mục thuốc.' })
      await Promise.all([
        fetchMedicineCategories(false),
        fetchMedicines({
          keyword: debouncedSearch,
          categoryId: nextCategoryFilter,
          status: statusFilter,
        }),
      ])
    } catch (categoryError: any) {
      toast({
        title: 'Lỗi',
        description: categoryError?.message || 'Không thể xóa danh mục thuốc.',
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
          <Select
            value={formData.medicineCategoryId || undefined}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, medicineCategoryId: value }))}
            disabled={medicineCategoriesLoading || sortedMedicineCategories.length === 0}
          >
            <SelectTrigger id="medicine-category">
              <SelectValue
                placeholder={medicineCategoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục thuốc'}
              />
            </SelectTrigger>
            <SelectContent>
              {sortedMedicineCategories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {getCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {medicineCategoriesError && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span>Không thể tải danh mục thuốc.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                onClick={() => void fetchMedicineCategories()}
              >
                Tải lại
              </Button>
            </div>
          )}

          {!medicineCategoriesLoading && !medicineCategoriesError && sortedMedicineCategories.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Chưa có danh mục thuốc. Hãy tạo danh mục trước khi lưu thuốc.
            </p>
          )}
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
            Quản lý kho thuốc, danh mục thuốc và thông tin chi tiết từng mặt hàng
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={(open) => {
              setIsCategoryDialogOpen(open)
              if (!open) {
                resetCategoryForm()
                setCategoryDetailLoadingId(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300 bg-white">
                <Tags className="mr-2 h-4 w-4" />
                Danh mục thuốc
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>Quản lý danh mục thuốc</DialogTitle>
                <DialogDescription>
                  Thêm, chỉnh sửa và xóa danh mục để dùng cho form tạo hoặc cập nhật thuốc.
                </DialogDescription>
              </DialogHeader>

              <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto py-2 pr-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-4">
                    <p className="font-semibold text-slate-900">
                      {selectedCategory ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Danh mục được dùng trực tiếp trong dropdown thêm và sửa thuốc.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="medicine-category-name">Tên danh mục</Label>
                      <Input
                        id="medicine-category-name"
                        value={categoryFormData.name}
                        onChange={(event) =>
                          setCategoryFormData((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="medicine-category-description">Mô tả</Label>
                      <Textarea
                        id="medicine-category-description"
                        rows={4}
                        value={categoryFormData.description}
                        onChange={(event) =>
                          setCategoryFormData((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>

                    {categoryFormError && <p className="text-sm text-red-600">{categoryFormError}</p>}

                    <div className="flex items-center justify-end gap-2">
                      {selectedCategory && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetCategoryForm}
                          disabled={isCategorySubmitting}
                        >
                          Hủy chỉnh sửa
                        </Button>
                      )}
                      <Button type="button" onClick={handleSaveCategory} disabled={isCategorySubmitting}>
                        {isCategorySubmitting
                          ? 'Đang lưu...'
                          : selectedCategory
                            ? 'Lưu danh mục'
                            : 'Tạo danh mục'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Danh sách danh mục</p>
                      <p className="text-sm text-slate-500">
                        {sortedMedicineCategories.length} danh mục đang khả dụng cho dropdown chọn thuốc
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={resetCategoryForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo mới
                    </Button>
                  </div>

                  {medicineCategoriesLoading && sortedMedicineCategories.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <AdminTableSkeleton rows={4} />
                    </div>
                  )}

                  {!medicineCategoriesLoading && medicineCategoriesError && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <AdminErrorState
                        message={medicineCategoriesError}
                        onRetry={() => void fetchMedicineCategories()}
                      />
                    </div>
                  )}

                  {!medicineCategoriesLoading && !medicineCategoriesError && sortedMedicineCategories.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Chưa có danh mục thuốc nào.
                    </div>
                  )}

                  {!medicineCategoriesLoading && !medicineCategoriesError && sortedMedicineCategories.length > 0 && (
                    <div className="max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="border-b border-slate-200">
                            <TableHead className="px-3 py-3">Danh mục</TableHead>
                            <TableHead className="w-[84px] px-3 py-3 text-center">Số thuốc</TableHead>
                            <TableHead className="w-[96px] px-3 py-3 text-right">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedMedicineCategories.map((category) => (
                            <TableRow
                              key={category.id}
                              className={selectedCategory?.id === category.id ? 'bg-slate-50' : ''}
                            >
                              <TableCell className="px-3 py-3 align-top">
                                <p className="font-medium text-slate-900">{getCategoryLabel(category)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {safeString(category.description) || 'Không có mô tả'}
                                </p>
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center">
                                {safeNumber(category.medicineCount, 0)}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => void handleStartEditCategory(String(category.id))}
                                    disabled={categoryDetailLoadingId === category.id}
                                  >
                                    {categoryDetailLoadingId === category.id ? (
                                      <span className="text-xs text-slate-500">...</span>
                                    ) : (
                                      <Edit className="h-4 w-4" />
                                    )}
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Xóa danh mục thuốc</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Bạn có chắc muốn xóa danh mục {getCategoryLabel(category)}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => void handleDeleteCategory(String(category.id))}>
                                          Xóa
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_260px_220px]">
            <div className="grid gap-2">
              <Label htmlFor="medicine-search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="medicine-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Tìm theo tên thuốc hoặc nhà sản xuất"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medicine-filter-category">Danh mục</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="medicine-filter-category">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Tất cả danh mục</SelectItem>
                  {sortedMedicineCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medicine-filter-status">Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="medicine-filter-status">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Tất cả trạng thái</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {medicineCategoriesError && (
            <p className="mt-3 text-xs text-amber-700">
              Không thể tải danh mục để lọc hoặc chọn trong form. Bạn vẫn có thể bấm "Danh mục thuốc" để thử tải lại.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Hiển thị {sortedMedicines.length} thuốc
            </span>
            <span>
              API dùng `keyword`, `categoryId`, `status` theo backend mới
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          {loading && (
            <div className="p-4">
              <AdminTableSkeleton rows={8} />
            </div>
          )}

          {!loading && error && (
            <div className="p-4">
              <AdminErrorState message={error} onRetry={() => void fetchMedicines()} />
            </div>
          )}

          {!loading && !error && sortedMedicines.length === 0 && (
            <div className="p-6">
              <AdminEmptyState title="Không có thuốc phù hợp với bộ lọc hiện tại." />
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
                    const quantity = safeNumber(medicine.quantity, 0)

                    return (
                      <TableRow key={String(medicine.id)} className="border-b border-slate-100">
                        <TableCell className="px-6 py-4 font-semibold text-slate-900">
                          {safeString(medicine.name) || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {safeString(medicine.medicineCategoryName) || '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4">{safeString(medicine.manufacturer) || '-'}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={`rounded-full border font-medium ${getQuantityBadgeClass(statusText, quantity)}`}>
                            {quantity} {safeString(medicine.unit)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">{formatCurrencyVnd(safeNumber(medicine.price, 0))}</TableCell>
                        <TableCell className={`px-6 py-4 ${medicine.expired ? 'text-red-600' : ''}`}>
                          {expiryText}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={`rounded-full border font-medium ${getStatusBadgeClass(statusText, quantity)}`}>
                            {getStatusLabel(statusText, quantity)}
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
