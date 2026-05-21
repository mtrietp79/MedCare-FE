import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Archive, Upload, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
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

interface ServiceFormData {
  name: string
  description: string
  price: string
  specialtyId: string
  prescriptionItems: Array<{ medicineId: string; quantity: string; dosage: string }>
  active: boolean
}

const initialForm: ServiceFormData = {
  name: '',
  description: '',
  price: '0',
  specialtyId: '',
  prescriptionItems: [],
  active: true,
}

export function AdminMedicalServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ServiceFormData>(initialForm)
  const [formError, setFormError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [servicesData, specialtiesData] = await Promise.all([
        adminApi.getMedicalServices(),
        adminApi.getSpecialties(),
      ])

      setServices(Array.isArray(servicesData) ? servicesData : [])
      setSpecialties(Array.isArray(specialtiesData) ? specialtiesData : [])
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải dữ liệu dịch vụ y tế.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Tên dịch vụ là bắt buộc.')
      return false
    }
    if (!formData.specialtyId) {
      setFormError('Chọn chuyên khoa là bắt buộc.')
      return false
    }
    if (Number(formData.price) < 0 || Number.isNaN(Number(formData.price))) {
      setFormError('Giá phải là số lớn hơn hoặc bằng 0.')
      return false
    }
    for (const item of formData.prescriptionItems) {
      if (!item.medicineId.trim() || !item.quantity.trim() || !item.dosage.trim()) {
        setFormError('Các mục kê đơn phải có đầy đủ thuốc, số lượng và liều dùng hoặc bỏ trống toàn bộ.')
        return false
      }
      if (Number(item.quantity) < 0 || Number.isNaN(Number(item.quantity))) {
        setFormError('Số lượng kê đơn phải là số lớn hơn hoặc bằng 0.')
        return false
      }
    }
    setFormError('')
    return true
  }

  const getPayload = () => ({
    name: formData.name.trim(),
    description: formData.description.trim() || null,
    price: Number(formData.price) || 0,
    specialty: { id: formData.specialtyId },
    prescriptionItems: formData.prescriptionItems.map((item) => ({
      medicine: { id: item.medicineId.trim() },
      quantity: Number(item.quantity) || 0,
      dosage: item.dosage.trim(),
    })),
    active: formData.active,
  })

  const resetForm = () => {
    setFormData(initialForm)
    setPhotoFile(null)
    setPhotoError('')
    setFormError('')
    setSelectedService(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (service: any) => {
    setSelectedService(service)
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: String(service.price ?? 0),
      specialtyId: service.specialty?.id || service.specialtyId || '',
      prescriptionItems: Array.isArray(service.prescriptionItems)
        ? service.prescriptionItems.map((item: any) => ({
            medicineId: item?.medicine?.id ? String(item.medicine.id) : '',
            quantity: String(item.quantity ?? 0),
            dosage: item.dosage || '',
          }))
        : [],
      active: service.active !== false,
    })
    setPhotoFile(null)
    setFormError('')
    setPhotoError('')
    setIsEditDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const created = await adminApi.createMedicalService(getPayload())
      if (photoFile && created?.id) {
        await adminApi.uploadMedicalServicePhoto(created.id, photoFile)
      }
      toast({ title: 'Thành công', description: 'Đã tạo gói dịch vụ mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (createError: any) {
      toast({ title: 'Lỗi', description: createError?.message || 'Không thể tạo gói dịch vụ.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedService) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.updateMedicalService(selectedService.id, getPayload())
      if (photoFile) {
        await adminApi.uploadMedicalServicePhoto(selectedService.id, photoFile)
      }
      toast({ title: 'Thành công', description: 'Đã cập nhật gói dịch vụ.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (updateError: any) {
      toast({ title: 'Lỗi', description: updateError?.message || 'Không thể cập nhật gói dịch vụ.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (service: any) => {
    try {
      await adminApi.setMedicalServiceActive(service.id, !service.active)
      toast({ title: 'Thành công', description: `Gói dịch vụ đã được ${service.active ? 'ngưng hoạt động' : 'kích hoạt'}.` })
      await fetchData()
    } catch (toggleError: any) {
      toast({ title: 'Lỗi', description: toggleError?.message || 'Không thể cập nhật trạng thái.', variant: 'destructive' })
    }
  }

  const handleDeletePhoto = async () => {
    if (!selectedService) return
    try {
      await adminApi.deleteMedicalServicePhoto(selectedService.id)
      toast({ title: 'Thành công', description: 'Đã xóa ảnh dịch vụ.' })
      await fetchData()
      setPhotoFile(null)
    } catch (deleteError: any) {
      toast({ title: 'Lỗi', description: deleteError?.message || 'Không thể xóa ảnh.', variant: 'destructive' })
    }
  }

  const selectedSpecialtyName = useMemo(
    () => specialties.find((item) => item.id === formData.specialtyId)?.name || '',
    [formData.specialtyId, specialties]
  )

  const renderPrescriptionItems = () => (
    <div className="space-y-4">
      {formData.prescriptionItems.map((item, index) => (
        <div key={index} className="rounded-3xl border border-border/80 p-4 space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor={`medicine-id-${index}`}>ID thuốc</Label>
              <Input
                id={`medicine-id-${index}`}
                value={item.medicineId}
                onChange={(event) => {
                  const value = event.target.value
                  setFormData((prev) => {
                    const next = { ...prev }
                    next.prescriptionItems[index] = { ...next.prescriptionItems[index], medicineId: value }
                    return next
                  })
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`quantity-${index}`}>Số lượng</Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                min={0}
                value={item.quantity}
                onChange={(event) => {
                  const value = event.target.value
                  setFormData((prev) => {
                    const next = { ...prev }
                    next.prescriptionItems[index] = { ...next.prescriptionItems[index], quantity: value }
                    return next
                  })
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`dosage-${index}`}>Liều dùng</Label>
              <Input
                id={`dosage-${index}`}
                value={item.dosage}
                onChange={(event) => {
                  const value = event.target.value
                  setFormData((prev) => {
                    const next = { ...prev }
                    next.prescriptionItems[index] = { ...next.prescriptionItems[index], dosage: value }
                    return next
                  })
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  prescriptionItems: prev.prescriptionItems.filter((_, idx) => idx !== index),
                }))
              }}
            >
              Xóa mục
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          setFormData((prev) => ({
            ...prev,
            prescriptionItems: [...prev.prescriptionItems, { medicineId: '', quantity: '0', dosage: '' }],
          }))
        }}
      >
        Thêm mục kê đơn
      </Button>
    </div>
  )

  const renderForm = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="service-name">Tên gói dịch vụ</Label>
          <Input
            id="service-name"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service-specialty">Chuyên khoa</Label>
          <Select
            value={formData.specialtyId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, specialtyId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn chuyên khoa" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="service-price">Giá (VND)</Label>
            <Input
              id="service-price"
              type="number"
              min={0}
              value={formData.price}
              onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-active">Trạng thái</Label>
            <Select
              value={formData.active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, active: value === 'active' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service-description">Mô tả</Label>
          <Textarea
            id="service-description"
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-base font-semibold">Danh sách kê đơn</Label>
            <p className="text-sm text-muted-foreground">Có thể để trống nếu bác sĩ sẽ kê sau khám.</p>
          </div>
          <Button size="sm" variant="outline" type="button" onClick={() => setFormData((prev) => ({ ...prev, prescriptionItems: [] }))}>
            Xóa tất cả
          </Button>
        </div>
        {renderPrescriptionItems()}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="service-photo">Ảnh dịch vụ</Label>
        <input
          id="service-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            if (!file) {
              setPhotoFile(null)
              return
            }
            if (file.size > 2 * 1024 * 1024) {
              setPhotoError('Ảnh phải nhỏ hơn 2MB.')
              setPhotoFile(null)
              return
            }
            setPhotoError('')
            setPhotoFile(file)
          }}
        />
        {photoError && <p className="text-sm text-red-600">{photoError}</p>}
        {selectedService?.imageUrl && !photoFile && (
          <div className="rounded-3xl border border-border/80 overflow-hidden">
            <img src={selectedService.imageUrl} alt="Ảnh dịch vụ" className="h-40 w-full object-cover" />
            <div className="p-4 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Ảnh hiện tại</span>
              <Button variant="outline" size="sm" onClick={handleDeletePhoto}>
                Xóa ảnh
              </Button>
            </div>
          </div>
        )}
        {photoFile && (
          <div className="rounded-3xl border border-border/80 overflow-hidden">
            <img src={URL.createObjectURL(photoFile)} alt="Ảnh chọn" className="h-40 w-full object-cover" />
          </div>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý gói dịch vụ</h1>
          <p className="text-muted-foreground">Tạo, sửa, bật/tắt trạng thái và quản lý ảnh cho gói dịch vụ khám bệnh.</p>
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
              Thêm gói dịch vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle>Thêm gói dịch vụ mới</DialogTitle>
              <DialogDescription>Nhập thông tin gói dịch vụ và upload ảnh riêng.</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo gói dịch vụ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói dịch vụ</CardTitle>
          <CardDescription>{services.length} gói dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <AdminTableSkeleton rows={7} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchData()} />}
          {!loading && !error && services.length === 0 && <AdminEmptyState title="Chưa có gói dịch vụ nào." />}

          {!loading && !error && services.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên dịch vụ</TableHead>
                  <TableHead>Chuyên khoa</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name || '-'}</TableCell>
                    <TableCell>{service.specialty?.name || service.specialtyName || '-'}</TableCell>
                    <TableCell>{Number(service.price || 0).toLocaleString('vi-VN')} VND</TableCell>
                    <TableCell>
                      <Badge variant={service.active ? 'default' : 'secondary'}>
                        {service.active ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleToggleActive(service)}>
                        <Archive className="w-4 h-4" />
                      </Button>
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
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
            <DialogDescription>Thay đổi thông tin gói dịch vụ và upload ảnh mới nếu cần.</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={isSubmitting || photoUploading}>
              {isSubmitting || photoUploading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
