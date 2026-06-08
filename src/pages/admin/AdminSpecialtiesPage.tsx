import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizeSpecialty, safeLower, type NormalizedSpecialty } from '@/lib/admin-normalizers'
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

interface SpecialtyForm {
  name: string
  description: string
}

const initialForm: SpecialtyForm = {
  name: '',
  description: '',
}

export function AdminSpecialtiesPage() {
  const { toast } = useToast()

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

  const fetchSpecialties = async () => {
    setLoading(true)
    setError('')

    try {
      const raw = await adminApi.getSpecialties()
      const normalized = (Array.isArray(raw) ? raw : []).map(normalizeSpecialty)
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

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteSpecialty(id)
      toast({ title: 'Thành công', description: 'Đã xóa chuyên khoa.' })
      await fetchSpecialties()
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa chuyên khoa.',
        variant: 'destructive',
      })
    }
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
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell className="font-medium">{specialty.name || '-'}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{specialty.description || '-'}</TableCell>
                    <TableCell>{specialty.doctorCount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(specialty)}>
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
                              Bạn có chắc muốn xóa chuyên khoa {specialty.name || specialty.id}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(specialty.id)}>Xóa</AlertDialogAction>
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
    </div>
  )
}
