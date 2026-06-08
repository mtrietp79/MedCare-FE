import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, Search, Edit, Trash2, Power, PowerOff, Loader2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import {
  adminSpecialtyService,
  type SpecialtyDeleteCheckResult,
} from '@/services/adminSpecialtyService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizeSpecialty, safeLower, type NormalizedSpecialty } from '@/lib/admin-normalizers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

interface SpecialtyForm {
  name: string
  description: string
}

type DeleteModalType = 'confirm' | 'blocked-doctors' | 'blocked-related'

const initialForm: SpecialtyForm = {
  name: '',
  description: '',
}

function SpecialtyStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
      Hoạt động
    </Badge>
  ) : (
    <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      Tạm ngưng
    </Badge>
  )
}

export function AdminSpecialtiesPage() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [specialties, setSpecialties] = useState<NormalizedSpecialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'doctor_desc'>('name_asc')

  const [selectedSpecialty, setSelectedSpecialty] = useState<NormalizedSpecialty | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<SpecialtyForm>(initialForm)
  const [formError, setFormError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<NormalizedSpecialty | null>(null)
  const [deleteCheckLoading, setDeleteCheckLoading] = useState(false)
  const [deleteCheckResult, setDeleteCheckResult] = useState<SpecialtyDeleteCheckResult | null>(null)
  const [deleteModalType, setDeleteModalType] = useState<DeleteModalType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusActionLoadingKey, setStatusActionLoadingKey] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<NormalizedSpecialty | null>(null)

  const fetchSpecialties = async () => {
    setLoading(true)
    setError('')

    try {
      const raw = await adminSpecialtyService.getSpecialties()
      const normalized = raw.map(normalizeSpecialty)
      setSpecialties(normalized)
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách chuyên khoa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSpecialties()
  }, [])

  const filteredSpecialties = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    const list = specialties.filter((item) => {
      if (!keyword) return true
      return safeLower(item.name).includes(keyword) || safeLower(item.description).includes(keyword)
    })

    list.sort((a, b) => {
      if (sortBy === 'name_desc') return a.name.localeCompare(b.name) * -1
      if (sortBy === 'doctor_desc') return b.doctorCount - a.doctorCount
      return a.name.localeCompare(b.name)
    })

    return list
  }, [specialties, debouncedSearch, sortBy])

  const resetForm = () => {
    setFormData(initialForm)
    setFormError('')
    setSelectedSpecialty(null)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setDeleteCheckResult(null)
    setDeleteModalType(null)
    setDeleteCheckLoading(false)
    setIsDeleting(false)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Tên chuyên khoa là bắt buộc.')
      return false
    }
    setFormError('')
    return true
  }

  const handleCreate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.createSpecialty({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      })
      toast({ title: 'Thành công', description: 'Đã tạo chuyên khoa mới.' })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchSpecialties()
    } catch (createError: any) {
      toast({
        title: 'Lỗi',
        description: createError?.message || 'Không thể tạo chuyên khoa.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (specialty: NormalizedSpecialty) => {
    setSelectedSpecialty(specialty)
    setFormData({
      name: specialty.name,
      description: specialty.description,
    })
    setFormError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedSpecialty) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await adminApi.updateSpecialty(selectedSpecialty.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      })
      toast({ title: 'Thành công', description: 'Đã cập nhật chuyên khoa.' })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchSpecialties()
    } catch (updateError: any) {
      toast({
        title: 'Lỗi',
        description: updateError?.message || 'Không thể cập nhật chuyên khoa.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async (specialty: NormalizedSpecialty) => {
    setDeleteTarget(specialty)
    setDeleteCheckResult(null)
    setDeleteModalType(null)
    setDeleteCheckLoading(true)

    try {
      const result = await adminSpecialtyService.checkDelete(specialty.id)
      setDeleteCheckResult(result)

      if (result.canDelete) {
        setDeleteModalType('confirm')
      } else if (result.doctorCount > 0) {
        setDeleteModalType('blocked-doctors')
      } else {
        setDeleteModalType('blocked-related')
      }
    } catch (checkError: unknown) {
      closeDeleteModal()
      toast({
        title: 'Lỗi',
        description: adminSpecialtyService.getErrorMessage(
          checkError,
          'Không thể kiểm tra điều kiện xóa chuyên khoa.',
        ),
        variant: 'destructive',
      })
    } finally {
      setDeleteCheckLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await adminSpecialtyService.deleteSpecialty(deleteTarget.id)
      toast({ title: 'Thành công', description: 'Xóa chuyên khoa thành công' })
      closeDeleteModal()
      await fetchSpecialties()
    } catch (deleteError: unknown) {
      toast({
        title: 'Lỗi',
        description: adminSpecialtyService.getErrorMessage(deleteError, 'Không thể xóa chuyên khoa.'),
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmDeactivate = async (specialty?: NormalizedSpecialty | null) => {
    const target = specialty ?? deactivateTarget ?? deleteTarget
    if (!target) return

    try {
      setStatusActionLoadingKey(`deactivate-${target.id}`)
      await adminSpecialtyService.deactivateSpecialty(target.id)
      toast({ title: 'Thành công', description: 'Tạm ngưng chuyên khoa thành công' })
      setDeactivateTarget(null)
      closeDeleteModal()
      await fetchSpecialties()
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: adminSpecialtyService.getErrorMessage(actionError, 'Không thể tạm ngưng chuyên khoa.'),
        variant: 'destructive',
      })
    } finally {
      setStatusActionLoadingKey('')
    }
  }

  const handleActivate = async (specialty: NormalizedSpecialty) => {
    try {
      setStatusActionLoadingKey(`activate-${specialty.id}`)
      await adminSpecialtyService.activateSpecialty(specialty.id)
      toast({ title: 'Thành công', description: 'Kích hoạt chuyên khoa thành công' })
      await fetchSpecialties()
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: adminSpecialtyService.getErrorMessage(actionError, 'Không thể kích hoạt chuyên khoa.'),
        variant: 'destructive',
      })
    } finally {
      setStatusActionLoadingKey('')
    }
  }

  const handleViewDoctors = (specialty?: NormalizedSpecialty | null) => {
    const target = specialty || deleteTarget
    if (!target) {
      navigate('/admin/doctors')
      return
    }
    closeDeleteModal()
    navigate(`/admin/doctors?specialtyId=${target.id}`)
  }

  const renderForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="specialty-name">Tên chuyên khoa</Label>
        <Input
          id="specialty-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="specialty-description">Mô tả</Label>
        <Textarea
          id="specialty-description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </div>
  )

  const doctorCount = deleteCheckResult?.doctorCount ?? 0
  const appointmentCount = deleteCheckResult?.appointmentCount ?? 0
  const medicalRecordCount = deleteCheckResult?.medicalRecordCount ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chuyên khoa</h1>
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
              Thêm chuyên khoa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo chuyên khoa mới</DialogTitle>
              <DialogDescription>Thông tin chuyên khoa hiển thị cho bác sĩ và người bệnh.</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo chuyên khoa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chuyên khoa</CardTitle>
          <CardDescription>Tổng cộng {specialties.length} chuyên khoa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên/mô tả"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'name_asc' | 'name_desc' | 'doctor_desc') => setSortBy(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Tên A-Z</SelectItem>
                <SelectItem value="name_desc">Tên Z-A</SelectItem>
                <SelectItem value="doctor_desc">Nhiều bác sĩ trước</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={6} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchSpecialties()} />}
          {!loading && !error && filteredSpecialties.length === 0 && <AdminEmptyState title="Không có chuyên khoa phù hợp." />}

          {!loading && !error && filteredSpecialties.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chuyên khoa</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số bác sĩ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell className="font-medium">{specialty.name || '-'}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{specialty.description || '-'}</TableCell>
                    <TableCell>{specialty.doctorCount}</TableCell>
                    <TableCell>
                      <SpecialtyStatusBadge isActive={specialty.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(specialty)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {specialty.isActive ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Tạm ngưng"
                            disabled={statusActionLoadingKey === `deactivate-${specialty.id}`}
                            onClick={() => setDeactivateTarget(specialty)}
                          >
                            {statusActionLoadingKey === `deactivate-${specialty.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                            ) : (
                              <PowerOff className="h-4 w-4 text-amber-600" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Kích hoạt lại"
                            disabled={statusActionLoadingKey === `activate-${specialty.id}`}
                            onClick={() => void handleActivate(specialty)}
                          >
                            {statusActionLoadingKey === `activate-${specialty.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            ) : (
                              <Power className="h-4 w-4 text-emerald-600" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteCheckLoading && deleteTarget?.id === specialty.id}
                          onClick={() => void handleDeleteClick(specialty)}
                        >
                          {deleteCheckLoading && deleteTarget?.id === specialty.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật chuyên khoa</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin mô tả chuyên khoa.</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteModalType === 'confirm'} onOpenChange={(open) => !open && closeDeleteModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chuyên khoa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa chuyên khoa {deleteTarget?.name} không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={deleteModalType === 'blocked-doctors' || deleteModalType === 'blocked-related'}
        onOpenChange={(open) => !open && closeDeleteModal()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Không thể xóa chuyên khoa</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm leading-relaxed text-muted-foreground">
                {deleteModalType === 'blocked-doctors' ? (
                  <>
                    <p>
                      Chuyên khoa này hiện đang có <strong>{doctorCount}</strong> bác sĩ đang hoạt động.
                      Bạn không thể xóa chuyên khoa khi vẫn còn bác sĩ thuộc chuyên khoa này.
                    </p>
                    <p>
                      Vui lòng chuyển các bác sĩ sang chuyên khoa khác hoặc tạm ngưng chuyên khoa này.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Chuyên khoa này hiện đang có bác sĩ hoặc dữ liệu khám bệnh liên quan.
                      Để đảm bảo dữ liệu hệ thống không bị mất, bạn không thể xóa trực tiếp chuyên khoa này.
                    </p>
                    <p>
                      Bạn có thể chuyển các bác sĩ sang chuyên khoa khác hoặc tạm ngưng chuyên khoa để ẩn khỏi hệ thống đặt lịch.
                    </p>
                  </>
                )}

                {(doctorCount > 0 || appointmentCount > 0 || medicalRecordCount > 0) && (
                  <div className="rounded-xl border bg-muted/30 p-3 text-foreground">
                    {doctorCount > 0 ? <p>Số bác sĩ: {doctorCount}</p> : null}
                    {appointmentCount > 0 ? <p>Số lịch hẹn: {appointmentCount}</p> : null}
                    {medicalRecordCount > 0 ? <p>Số bệnh án: {medicalRecordCount}</p> : null}
                  </div>
                )}

                {deleteCheckResult?.message ? (
                  <p className="text-xs italic">{deleteCheckResult.message}</p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
            <Button
              onClick={() => void handleConfirmDeactivate(deleteTarget)}
              disabled={statusActionLoadingKey === `deactivate-${deleteTarget?.id}`}
            >
              {statusActionLoadingKey === `deactivate-${deleteTarget?.id}` ? 'Đang xử lý...' : 'Tạm ngưng chuyên khoa'}
            </Button>
            <Button variant="outline" onClick={() => handleViewDoctors()}>
              Xem danh sách bác sĩ
            </Button>
            <Button variant="ghost" onClick={closeDeleteModal}>
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạm ngưng chuyên khoa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 leading-relaxed">
              <span className="block">
                Chuyên khoa này sẽ bị ẩn khỏi trang đặt lịch của bệnh nhân, nhưng dữ liệu bác sĩ, lịch hẹn và bệnh án cũ vẫn được giữ nguyên.
              </span>
              <span className="block">
                Bạn có chắc muốn tạm ngưng chuyên khoa này không?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(statusActionLoadingKey)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(statusActionLoadingKey)}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmDeactivate()
              }}
            >
              {statusActionLoadingKey === `deactivate-${deactivateTarget?.id}` ? 'Đang xử lý...' : 'Tạm ngưng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
