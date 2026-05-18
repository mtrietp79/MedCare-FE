import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizeMedicine, safeLower, type NormalizedMedicine } from '@/lib/admin-normalizers'
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

interface MedicineForm {
  name: string
  dosage: string
  description: string
  quantity: string
  unit: string
  price: string
  status: NormalizedMedicine['status']
}

const initialForm: MedicineForm = {
  name: '',
  dosage: '',
  description: '',
  quantity: '0',
  unit: '',
  price: '0',
  status: 'available',
}

export function AdminMedicinesPage() {
  const { toast } = useToast()

  const [medicines, setMedicines] = useState<NormalizedMedicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | NormalizedMedicine['status']>('all')

  const [selectedMedicine, setSelectedMedicine] = useState<NormalizedMedicine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<MedicineForm>(initialForm)
  const [formError, setFormError] = useState('')

  const fetchMedicines = async () => {
    setLoading(true)
    setError('')

    try {
      const raw = await adminApi.getMedicines()
      setMedicines((Array.isArray(raw) ? raw : []).map(normalizeMedicine))
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách thuốc.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMedicines()
  }, [])

  const filteredMedicines = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    return medicines
      .filter((medicine) => {
        const hitSearch = !keyword
          || safeLower(medicine.name).includes(keyword)
          || safeLower(medicine.description).includes(keyword)
          || safeLower(medicine.dosage).includes(keyword)

        const hitStatus = statusFilter === 'all' || medicine.status === statusFilter
        return hitSearch && hitStatus
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [medicines, debouncedSearch, statusFilter])

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

    if (Number(formData.price) < 0 || Number(formData.quantity) < 0) {
      setFormError('Giá và số lượng phải >= 0.')
      return false
    }

    setFormError('')
    return true
  }

  const payloadFromForm = (form: MedicineForm) => ({
    name: form.name.trim(),
    dosage: form.dosage.trim() || null,
    description: form.description.trim() || null,
    quantity: Number(form.quantity) || 0,
    unit: form.unit.trim() || null,
    price: Number(form.price) || 0,
    status: form.status,
  })

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.createMedicine(payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã thêm thuốc mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchMedicines()
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

  const openEditDialog = (medicine: NormalizedMedicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name,
      dosage: medicine.dosage,
      description: medicine.description,
      quantity: String(medicine.quantity),
      unit: medicine.unit,
      price: String(medicine.price),
      status: medicine.status,
    })
    setFormError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedMedicine) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.updateMedicine(selectedMedicine.id, payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã cập nhật thuốc.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchMedicines()
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
      await fetchMedicines()
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa thuốc.',
        variant: 'destructive',
      })
    }
  }

  const statusBadge = (status: NormalizedMedicine['status']) => {
    if (status === 'available') return <Badge variant="default">Còn hàng</Badge>
    if (status === 'out_of_stock') return <Badge variant="destructive">Hết hàng</Badge>
    return <Badge variant="secondary">Ngừng kinh doanh</Badge>
  }

  const renderForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="medicine-name">Tên thuốc</Label>
        <Input id="medicine-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="medicine-dosage">Liều lượng</Label>
          <Input id="medicine-dosage" value={formData.dosage} onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="medicine-unit">Đơn vị</Label>
          <Input id="medicine-unit" value={formData.unit} onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="medicine-quantity">Số lượng</Label>
          <Input id="medicine-quantity" type="number" min={0} value={formData.quantity} onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="medicine-price">Giá (VND)</Label>
          <Input id="medicine-price" type="number" min={0} value={formData.price} onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Trạng thái</Label>
        <Select value={formData.status} onValueChange={(value: NormalizedMedicine['status']) => setFormData((prev) => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Còn hàng</SelectItem>
            <SelectItem value="out_of_stock">Hết hàng</SelectItem>
            <SelectItem value="discontinued">Ngừng kinh doanh</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="medicine-description">Mô tả</Label>
        <Textarea id="medicine-description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thuốc</h1>
          <p className="text-muted-foreground">CRUD thuốc, tìm kiếm và lọc theo trạng thái</p>
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
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Thêm thuốc mới</DialogTitle>
              <DialogDescription>Thông tin thuốc phục vụ kê đơn và quản lý kho.</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo thuốc'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thuốc</CardTitle>
          <CardDescription>Tổng cộng {medicines.length} loại thuốc</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên/mô tả/liều lượng" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | NormalizedMedicine['status']) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="available">Còn hàng</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                <SelectItem value="discontinued">Ngừng kinh doanh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchMedicines()} />}
          {!loading && !error && filteredMedicines.length === 0 && <AdminEmptyState title="Không có thuốc phù hợp." />}

          {!loading && !error && filteredMedicines.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Liều lượng</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name || '-'}</TableCell>
                    <TableCell>{medicine.dosage || '-'}</TableCell>
                    <TableCell>{medicine.quantity} {medicine.unit || ''}</TableCell>
                    <TableCell>{medicine.price.toLocaleString('vi-VN')} VND</TableCell>
                    <TableCell>{statusBadge(medicine.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(medicine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa thuốc {medicine.name || medicine.id}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(medicine.id)}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thuốc</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin thuốc và tồn kho.</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
