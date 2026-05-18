import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizePatient, safeLower, type NormalizedPatient } from '@/lib/admin-normalizers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface PatientForm {
  fullName: string
  phone: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dateOfBirth: string
  nationalId: string
  address: string
}

const initialForm: PatientForm = {
  fullName: '',
  phone: '',
  email: '',
  gender: 'MALE',
  dateOfBirth: '',
  nationalId: '',
  address: '',
}

export function AdminPatientsPage() {
  const { toast } = useToast()

  const [patients, setPatients] = useState<NormalizedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [profileFilter, setProfileFilter] = useState<'all' | 'completed' | 'incomplete'>('all')

  const [selectedPatient, setSelectedPatient] = useState<NormalizedPatient | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<PatientForm>(initialForm)
  const [formError, setFormError] = useState('')

  const fetchPatients = async () => {
    setLoading(true)
    setError('')

    try {
      const raw = await adminApi.getPatients()
      setPatients((Array.isArray(raw) ? raw : []).map(normalizePatient))
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách bệnh nhân.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    return patients
      .filter((patient) => {
        const hitSearch = !keyword
          || safeLower(patient.fullName).includes(keyword)
          || safeLower(patient.email).includes(keyword)
          || safeLower(patient.phone).includes(keyword)

        const hitFilter = profileFilter === 'all'
          || (profileFilter === 'completed' && patient.profileCompleted)
          || (profileFilter === 'incomplete' && !patient.profileCompleted)

        return hitSearch && hitFilter
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [patients, debouncedSearch, profileFilter])

  const resetForm = () => {
    setFormData(initialForm)
    setFormError('')
    setSelectedPatient(null)
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setFormError('Họ tên bệnh nhân là bắt buộc.')
      return false
    }

    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setFormError('Email không hợp lệ.')
      return false
    }

    if (formData.phone.trim() && !/^\d{9,11}$/.test(formData.phone.trim())) {
      setFormError('Số điện thoại phải từ 9 đến 11 chữ số.')
      return false
    }

    if (formData.nationalId.trim() && !/^\d{12}$/.test(formData.nationalId.trim())) {
      setFormError('CCCD phải gồm đúng 12 chữ số.')
      return false
    }

    setFormError('')
    return true
  }

  const payloadFromForm = (form: PatientForm) => ({
    fullName: form.fullName.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    gender: form.gender,
    dateOfBirth: form.dateOfBirth || null,
    nationalId: form.nationalId.trim() || null,
    address: form.address.trim() || null,
  })

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.createPatient(payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã tạo bệnh nhân mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchPatients()
    } catch (createError: any) {
      toast({
        title: 'Lỗi',
        description: createError?.message || 'Không thể tạo bệnh nhân.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (patient: NormalizedPatient) => {
    setSelectedPatient(patient)
    setFormData((prev) => ({
      ...prev,
      fullName: patient.fullName,
      phone: patient.phone,
      email: patient.email,
      gender: (patient.gender as PatientForm['gender']) || 'MALE',
      dateOfBirth: patient.dateOfBirth,
    }))
    setFormError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedPatient) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.updatePatient(selectedPatient.id, payloadFromForm(formData))
      toast({ title: 'Thành công', description: 'Đã cập nhật bệnh nhân.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchPatients()
    } catch (updateError: any) {
      toast({
        title: 'Lỗi',
        description: updateError?.message || 'Không thể cập nhật bệnh nhân.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deletePatient(id)
      toast({ title: 'Thành công', description: 'Đã xóa bệnh nhân.' })
      await fetchPatients()
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa bệnh nhân.',
        variant: 'destructive',
      })
    }
  }

  const profileBadge = (completed: boolean) => (
    completed ? <Badge variant="default">Đã hoàn thiện</Badge> : <Badge variant="secondary">Chưa hoàn thiện</Badge>
  )

  const renderForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="patient-fullName">Họ tên</Label>
        <Input id="patient-fullName" value={formData.fullName} onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="patient-phone">Số điện thoại</Label>
          <Input id="patient-phone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="patient-email">Email</Label>
          <Input id="patient-email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Giới tính</Label>
          <Select value={formData.gender} onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') => setFormData((prev) => ({ ...prev, gender: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="patient-dob">Ngày sinh</Label>
          <Input id="patient-dob" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="patient-nationalId">CCCD</Label>
          <Input id="patient-nationalId" value={formData.nationalId} onChange={(e) => setFormData((prev) => ({ ...prev, nationalId: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="patient-address">Địa chỉ</Label>
          <Input id="patient-address" value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} />
        </div>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bệnh nhân</h1>
          <p className="text-muted-foreground">Danh sách, CRUD, tìm kiếm và tình trạng hồ sơ</p>
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
              Thêm bệnh nhân
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
              <DialogDescription>Nhập thông tin bệnh nhân theo chuẩn backend.</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo bệnh nhân'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân</CardTitle>
          <CardDescription>Tổng cộng {patients.length} bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên/email/sđt" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-8" />
            </div>
            <Select value={profileFilter} onValueChange={(value: 'all' | 'completed' | 'incomplete') => setProfileFilter(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hồ sơ</SelectItem>
                <SelectItem value="completed">Đã hoàn thiện hồ sơ</SelectItem>
                <SelectItem value="incomplete">Chưa hoàn thiện hồ sơ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchPatients()} />}
          {!loading && !error && filteredPatients.length === 0 && <AdminEmptyState title="Không có bệnh nhân phù hợp." />}

          {!loading && !error && filteredPatients.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Trạng thái hồ sơ</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.fullName || '-'}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>{patient.gender || '-'}</TableCell>
                    <TableCell>{profileBadge(patient.profileCompleted)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(patient)}>
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
                              Bạn có chắc muốn xóa bệnh nhân {patient.fullName || patient.id}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(patient.id)}>Xóa</AlertDialogAction>
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
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Cập nhật bệnh nhân</DialogTitle>
            <DialogDescription>Chỉnh sửa hồ sơ bệnh nhân.</DialogDescription>
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
