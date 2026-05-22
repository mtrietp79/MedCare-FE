import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizeDoctor, normalizeSpecialty, safeLower, type NormalizedDoctor } from '@/lib/admin-normalizers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

interface DoctorForm {
  fullName: string
  email: string
  phone: string
  specialtyId: string
  username: string
  password: string
  experience: string
  price: string
  status: 'active' | 'inactive'
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  specialtyId?: string
  username?: string
  password?: string
  price?: string
}

const initialForm: DoctorForm = {
  fullName: '',
  email: '',
  phone: '',
  specialtyId: '',
  username: '',
  password: '',
  experience: '0',
  price: '0',
  status: 'active',
}

function validateDoctorForm(form: DoctorForm, isEdit: boolean): FormErrors {
  const errors: FormErrors = {}

  if (!form.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ tên bác sĩ.'
  }

  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = 'Email không hợp lệ.'
  }

  if (form.phone.trim() && !/^\d{9,11}$/.test(form.phone.trim())) {
    errors.phone = 'Số điện thoại phải từ 9 đến 11 chữ số.'
  }

  if (!form.specialtyId) {
    errors.specialtyId = 'Vui lòng chọn chuyên khoa.'
  }

  if (!isEdit && !form.username.trim()) {
    errors.username = 'Vui lòng nhập username tài khoản bác sĩ.'
  }

  if (!isEdit && form.password.trim().length < 6) {
    errors.password = 'Mật khẩu tối thiểu 6 ký tự.'
  }

  if (Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
    errors.price = 'Giá khám phải là số lớn hơn hoặc bằng 0.'
  }

  return errors
}

export function AdminDoctorsPage() {
  const { toast } = useToast()

  const [doctors, setDoctors] = useState<NormalizedDoctor[]>([])
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'specialty_asc'>('name_asc')

  const [selectedDoctor, setSelectedDoctor] = useState<NormalizedDoctor | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<DoctorForm>(initialForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')

  const fetchDoctors = async () => {
    setLoading(true)
    setError('')

    try {
      const [doctorData, specialtyData] = await Promise.all([
        adminApi.getDoctors(),
        adminApi.getSpecialties(),
      ])

      setDoctors((Array.isArray(doctorData) ? doctorData : []).map(normalizeDoctor))
      setSpecialties(
        (Array.isArray(specialtyData) ? specialtyData : [])
          .map(normalizeSpecialty)
          .map((item) => ({ id: item.id, name: item.name }))
          .filter((item) => item.id && item.name)
      )
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách bác sĩ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDoctors()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const filteredDoctors = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    const result = doctors.filter((doctor) => {
      const hitSearch = !keyword
        || safeLower(doctor.fullName).includes(keyword)
        || safeLower(doctor.email).includes(keyword)
        || safeLower(doctor.specialtyName).includes(keyword)
        || safeLower(doctor.username).includes(keyword)

      const hitStatus = statusFilter === 'all' || doctor.status === statusFilter
      return hitSearch && hitStatus
    })

    result.sort((a, b) => {
      if (sortBy === 'name_desc') {
        return a.fullName.localeCompare(b.fullName) * -1
      }

      if (sortBy === 'specialty_asc') {
        return a.specialtyName.localeCompare(b.specialtyName)
      }

      return a.fullName.localeCompare(b.fullName)
    })

    return result
  }, [doctors, debouncedSearch, statusFilter, sortBy])

  const resetForm = () => {
    if (photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoFile(null)
    setPhotoPreview('')
    setPhotoError('')
    setFormData(initialForm)
    setFormErrors({})
    setSelectedDoctor(null)
  }

  const openEditDialog = (doctor: NormalizedDoctor) => {
    setSelectedDoctor(doctor)
    setPhotoFile(null)
    setPhotoPreview(doctor.imageUrl || '')
    setPhotoError('')
    setFormData({
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone,
      specialtyId: doctor.specialtyId,
      username: doctor.username,
      password: '',
      experience: String(doctor.experience),
      price: String(doctor.price ?? 0),
      status: doctor.status,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const parseFieldErrors = (message?: string): FormErrors => {
    const errors: FormErrors = {}
    const lower = String(message || '').toLowerCase()

    if (lower.includes('email')) {
      errors.email = 'Email đã tồn tại hoặc không hợp lệ.'
    }
    if (lower.includes('username')) {
      errors.username = 'Tên đăng nhập đã tồn tại.'
    }

    return errors
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError('')
    const file = event.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview(selectedDoctor?.imageUrl || '')
      return
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Vui lòng chọn file ảnh hợp lệ.')
      return
    }

    if (photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const getCreatePayload = (form: DoctorForm) => ({
    fullName: form.fullName.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    price: Number(form.price) || 0,
    experienceYears: Number(form.experience),
    specialty: form.specialtyId ? { id: form.specialtyId } : null,
    account: {
      username: form.username.trim(),
      password: form.password,
    },
  })

  const getUpdatePayload = (form: DoctorForm) => ({
    fullName: form.fullName.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    price: Number(form.price) || 0,
    ...(form.experience !== '' ? { experienceYears: Number(form.experience) } : {}),
    specialty: form.specialtyId ? { id: form.specialtyId } : null,
    status: form.status,
  })

  const uploadDoctorPhoto = async (doctorId: string) => {
    if (!photoFile) return
    await adminApi.uploadDoctorPhoto(doctorId, photoFile)
  }

  const handleCreate = async () => {
    const errors = validateDoctorForm(formData, false)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const createdDoctor: any = await adminApi.createDoctor(getCreatePayload(formData))
      if (photoFile && createdDoctor?.id) {
        await uploadDoctorPhoto(createdDoctor.id)
      }
      toast({ title: 'Thành công', description: 'Đã tạo bác sĩ mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchDoctors()
    } catch (createError: any) {
      const fieldErrors = parseFieldErrors(createError?.message || createError?.data?.message)
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors)
      }
      toast({
        title: 'Lỗi',
        description: createError?.message || 'Không thể tạo bác sĩ.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedDoctor) return

    const errors = validateDoctorForm(formData, true)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await adminApi.updateDoctor(selectedDoctor.id, getUpdatePayload(formData))
      if (photoFile) {
        await uploadDoctorPhoto(selectedDoctor.id)
      }
      toast({ title: 'Thành công', description: 'Đã cập nhật thông tin bác sĩ.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchDoctors()
    } catch (updateError: any) {
      const fieldErrors = parseFieldErrors(updateError?.message || updateError?.data?.message)
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors)
      }
      toast({
        title: 'Lỗi',
        description: updateError?.message || 'Không thể cập nhật bác sĩ.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (doctorId: string) => {
    try {
      await adminApi.deleteDoctor(doctorId)
      toast({ title: 'Thành công', description: 'Đã xóa bác sĩ.' })
      await fetchDoctors()
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa bác sĩ.',
        variant: 'destructive',
      })
    }
  }

  const statusBadge = (status: NormalizedDoctor['status']) => {
    if (status === 'active') {
      return <Badge variant="default">Hoạt động</Badge>
    }
    return <Badge variant="secondary">Không hoạt động</Badge>
  }

  const renderForm = (isEdit: boolean) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor={isEdit ? 'edit-fullName' : 'create-fullName'}>Họ tên</Label>
        <Input
          id={isEdit ? 'edit-fullName' : 'create-fullName'}
          value={formData.fullName}
          onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
        />
        {formErrors.fullName && <p className="text-xs text-red-600">{formErrors.fullName}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={isEdit ? 'edit-email' : 'create-email'}>Email</Label>
        <Input
          id={isEdit ? 'edit-email' : 'create-email'}
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />
        {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={isEdit ? 'edit-phone' : 'create-phone'}>Số điện thoại</Label>
        <Input
          id={isEdit ? 'edit-phone' : 'create-phone'}
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
        />
        {formErrors.phone && <p className="text-xs text-red-600">{formErrors.phone}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Chuyên khoa</Label>
        <Select value={formData.specialtyId || ''} onValueChange={(value) => setFormData((prev) => ({ ...prev, specialtyId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn chuyên khoa" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((specialty) => (
              <SelectItem key={specialty.id} value={specialty.id}>{specialty.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.specialtyId && <p className="text-xs text-red-600">{formErrors.specialtyId}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={isEdit ? 'edit-experience' : 'create-experience'}>Kinh nghiệm (năm)</Label>
        <Input
          id={isEdit ? 'edit-experience' : 'create-experience'}
          type="number"
          min={0}
          value={formData.experience}
          onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={isEdit ? 'edit-price' : 'create-price'}>Giá khám (VND)</Label>
        <Input
          id={isEdit ? 'edit-price' : 'create-price'}
          type="number"
          min={0}
          value={formData.price}
          onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
        />
        {formErrors.price && <p className="text-xs text-red-600">{formErrors.price}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Ảnh bác sĩ</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-border bg-slate-100">
            {photoPreview || selectedDoctor?.imageUrl ? (
              <img
                src={photoPreview || selectedDoctor?.imageUrl || ''}
                alt={formData.fullName || 'Ảnh bác sĩ'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-3xl font-semibold">
                {(formData.fullName || formData.username || 'B').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="grid gap-2 flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-sm text-foreground file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground file:hover:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">Chọn ảnh bác sĩ để hiển thị trong danh sách quản lý.</p>
            {photoError && <p className="text-xs text-red-600">{photoError}</p>}
          </div>
        </div>
      </div>

      {!isEdit && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="create-username">Username đăng nhập</Label>
            <Input
              id="create-username"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            />
            {formErrors.username && <p className="text-xs text-red-600">{formErrors.username}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-password">Mật khẩu</Label>
            <Input
              id="create-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
            {formErrors.password && <p className="text-xs text-red-600">{formErrors.password}</p>}
          </div>
        </>
      )}

      {isEdit && (
        <div className="grid gap-2">
          <Label>Trạng thái</Label>
          <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bác sĩ</h1>
          <p className="text-muted-foreground">CRUD, tìm kiếm, lọc và cập nhật trạng thái bác sĩ</p>
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
              Thêm bác sĩ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Tạo bác sĩ mới</DialogTitle>
              <DialogDescription>Thông tin này sẽ được gửi lên backend theo contract hiện tại.</DialogDescription>
            </DialogHeader>
            {renderForm(false)}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo bác sĩ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bác sĩ</CardTitle>
          <CardDescription>Tổng cộng {doctors.length} bác sĩ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên/email/chuyên khoa/username"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'name_asc' | 'name_desc' | 'specialty_asc') => setSortBy(value)}>
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Tên A-Z</SelectItem>
                <SelectItem value="name_desc">Tên Z-A</SelectItem>
                <SelectItem value="specialty_asc">Chuyên khoa A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchDoctors()} />}
          {!loading && !error && filteredDoctors.length === 0 && (
            <AdminEmptyState title="Không có bác sĩ phù hợp với bộ lọc hiện tại." />
          )}

          {!loading && !error && filteredDoctors.length > 0 && (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-slate-100 border border-border">
                      {doctor.imageUrl ? (
                        <img
                          src={doctor.imageUrl}
                          alt={doctor.fullName || 'Bác sĩ'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-3xl font-semibold">
                          {(doctor.fullName || doctor.username || 'B').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-foreground">{doctor.fullName || '-'}</p>
                      <p className="text-sm text-muted-foreground">{doctor.specialtyName || '-'}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Email:</span> {doctor.email || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Điện thoại:</span> {doctor.phone || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Kinh nghiệm:</span> {doctor.experience} năm
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Giá khám:</span> {(doctor.price || 0).toLocaleString('vi-VN')} VND
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
                    {statusBadge(doctor.status)}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(doctor)}>
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
                              Bạn có chắc muốn xóa bác sĩ {doctor.fullName || doctor.username || doctor.id}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(doctor.id)}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <DialogTitle>Cập nhật bác sĩ</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin và trạng thái hoạt động.</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
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


