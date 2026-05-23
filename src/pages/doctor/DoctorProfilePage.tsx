import { useEffect, useMemo, useState } from 'react'
import { Star, Trash2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { doctorProfileService, type DoctorProfileResponse } from '@/services/doctorProfileService'
import { safeNumber, safeString } from '@/lib/admin-normalizers'
import { useToast } from '@/hooks/use-toast'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
  specialtyName: string
  address: string
  experienceYears: string
  bio: string
}

function formatDateDdMmYyyy(value?: string | null): string {
  const source = safeString(value)
  if (!source) return '-'

  const ymd = source.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '-'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

function getSpecialtyName(profile: DoctorProfileResponse): string {
  return safeString(profile.specialtyName)
    || (typeof profile.specialty === 'string' ? safeString(profile.specialty) : safeString(profile.specialty?.name))
    || '-'
}

function getAvatarUrl(profile: DoctorProfileResponse): string {
  return safeString(profile.avatarUrl) || safeString(profile.imageUrl) || safeString(profile.photoUrl)
}

export function DoctorProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null)
  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    email: '',
    phone: '',
    specialtyName: '',
    address: '',
    experienceYears: '',
    bio: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarDeleting, setAvatarDeleting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await doctorProfileService.getProfile()
      setProfile(data)
      setForm({
        fullName: safeString(data.fullName),
        email: safeString(data.email),
        phone: safeString(data.phone),
        specialtyName: getSpecialtyName(data),
        address: safeString(data.address),
        experienceYears: String(safeNumber(data.experienceYears ?? data.experience, 0)),
        bio: safeString(data.bio),
      })
      setAvatarPreview('')
      setAvatarFile(null)
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải hồ sơ bác sĩ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  const avatarSource = useMemo(() => {
    if (avatarPreview) return avatarPreview
    if (profile) return getAvatarUrl(profile)
    return ''
  }, [avatarPreview, profile])

  const hasServerAvatar = useMemo(() => Boolean(profile && getAvatarUrl(profile)), [profile])

  const handleSelectAvatar = (file: File | null) => {
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCancel = () => {
    if (!profile) return
    setForm({
      fullName: safeString(profile.fullName),
      email: safeString(profile.email),
      phone: safeString(profile.phone),
      specialtyName: getSpecialtyName(profile),
      address: safeString(profile.address),
      experienceYears: String(safeNumber(profile.experienceYears ?? profile.experience, 0)),
      bio: safeString(profile.bio),
    })
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleDeleteAvatar = async () => {
    if (!hasServerAvatar || avatarDeleting) return

    const shouldDelete = window.confirm('Bạn có chắc muốn xóa ảnh đại diện?')
    if (!shouldDelete) return

    setAvatarDeleting(true)
    try {
      await doctorProfileService.deleteAvatar()
      setAvatarFile(null)
      setAvatarPreview('')
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null, imageUrl: null, photoUrl: null } : prev))
      toast({ title: 'Thành công', description: 'Đã xóa ảnh đại diện' })
    } catch (deleteError: any) {
      toast({
        title: 'Lỗi',
        description: deleteError?.message || 'Không thể xóa ảnh đại diện.',
        variant: 'destructive',
      })
    } finally {
      setAvatarDeleting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await doctorProfileService.updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim(),
      })

      if (avatarFile) {
        setAvatarUploading(true)
        const uploadResponse = await doctorProfileService.uploadAvatar(avatarFile)
        const nextAvatarUrl = safeString(uploadResponse?.avatarUrl ?? uploadResponse?.imageUrl ?? uploadResponse?.photoUrl)
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                avatarUrl: nextAvatarUrl || prev.avatarUrl || null,
                imageUrl: nextAvatarUrl || prev.imageUrl || null,
                photoUrl: nextAvatarUrl || prev.photoUrl || null,
              }
            : prev
        )
        setAvatarFile(null)
        setAvatarPreview('')
      }

      toast({ title: 'Thành công', description: 'Đã cập nhật hồ sơ bác sĩ.' })
      await loadProfile()
    } catch (saveError: any) {
      toast({
        title: 'Lỗi',
        description: saveError?.message || 'Không thể cập nhật hồ sơ.',
        variant: 'destructive',
      })
    } finally {
      setAvatarUploading(false)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminTableSkeleton rows={6} />
      </div>
    )
  }

  if (error) {
    return <AdminErrorState message={error} onRetry={() => void loadProfile()} />
  }

  if (!profile) {
    return <AdminErrorState message="Không có dữ liệu hồ sơ bác sĩ." onRetry={() => void loadProfile()} />
  }

  const specialtyName = getSpecialtyName(profile)
  const rating = safeNumber(profile.rating, 0)
  const busyAvatar = avatarUploading || avatarDeleting

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Hồ sơ bác sĩ</h1>
        <p className="text-[#6b7280]">Quản lý thông tin cá nhân của bạn</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardHeader className="px-6 pb-4 pt-6">
            <div className="flex w-full flex-col items-center justify-center text-center">
              <Avatar className="mx-auto h-28 w-28">
                <AvatarImage src={avatarSource} alt={safeString(profile.fullName)} className="object-cover" />
                <AvatarFallback className="text-3xl">
                  {safeString(profile.fullName).split(' ').map((item) => item[0]).join('').slice(0, 2) || 'BS'}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4">
                <CardTitle>{safeString(profile.fullName) || '-'}</CardTitle>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Làm việc tại: Khoa {specialtyName !== '-' ? specialtyName : ''} MedCare
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm hover:bg-slate-50 ${busyAvatar ? 'pointer-events-none opacity-60' : ''}`}>
                  <Upload className="h-4 w-4" />
                  Chọn avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busyAvatar}
                    onChange={(event) => handleSelectAvatar(event.target.files?.[0] ?? null)}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  disabled={!hasServerAvatar || busyAvatar}
                  onClick={() => void handleDeleteAvatar()}
                >
                  <Trash2 className="h-4 w-4" />
                  {avatarDeleting ? 'Đang xóa...' : 'Xóa ảnh'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div><span className="font-semibold">Email:</span> {safeString(profile.email) || '-'}</div>
            <div><span className="font-semibold">Số điện thoại:</span> {safeString(profile.phone) || '-'}</div>
            <div><span className="font-semibold">Tham gia:</span> {formatDateDdMmYyyy(profile.createdAt)}</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Điểm đánh giá:</span>
              <Star className="h-4 w-4 text-amber-500" />
              <span>{rating === 0 ? '0' : rating.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Họ và tên</Label>
                <Input
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input value={form.email} disabled readOnly />
              </div>

              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>

              <div>
                <Label>Chuyên khoa</Label>
                <Input value={form.specialtyName} disabled readOnly />
              </div>
            </div>

            <div>
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>

            <div>
              <Label>Kinh nghiệm</Label>
              <Input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(event) => setForm((prev) => ({ ...prev, experienceYears: event.target.value }))}
              />
            </div>

            <div>
              <Label>Tiểu sử</Label>
              <Textarea
                rows={5}
                value={form.bio}
                onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => void handleSave()} disabled={saving || busyAvatar}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving || busyAvatar}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

