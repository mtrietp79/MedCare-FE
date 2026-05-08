import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Calendar, Award, Save, Edit } from 'lucide-react'
import { doctorApi } from '@/services/doctorService'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 ký tự'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  specialty: z.string().min(1, 'Vui lòng chọn chuyên khoa'),
  experience: z.string().min(1, 'Vui lòng nhập kinh nghiệm'),
  bio: z.string().max(500, 'Tiểu sử không được vượt quá 500 ký tự')
})

type ProfileFormData = z.infer<typeof profileSchema>

interface DoctorProfile {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  specialty: string
  experience: string
  bio: string
  avatar?: string
  licenseNumber: string
  department: string
  joinDate: string
  rating: number
  totalPatients: number
}

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await doctorApi.getProfile()
      setProfile(data)
      reset({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        specialty: data.specialty,
        experience: data.experience,
        bio: data.bio
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin hồ sơ',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true)
      await doctorApi.updateProfile(data)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật hồ sơ cá nhân'
      })
      setIsEditing(false)
      fetchProfile()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật hồ sơ',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        specialty: profile.specialty,
        experience: profile.experience,
        bio: profile.bio
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="md:col-span-2">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Không thể tải thông tin hồ sơ</p>
            <Button onClick={fetchProfile}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân của bạn</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={profile.avatar} alt={profile.fullName} />
              <AvatarFallback className="text-lg">
                {profile.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{profile.fullName}</CardTitle>
            <CardDescription>{profile.specialty}</CardDescription>
            <div className="flex justify-center space-x-2 mt-2">
              <Badge variant="secondary">{profile.department}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Số giấy phép: {profile.licenseNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tham gia: {new Date(profile.joinDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.rating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Đánh giá</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profile.totalPatients}</div>
                <div className="text-xs text-muted-foreground">Bệnh nhân</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
            <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    disabled={!isEditing}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled={!isEditing}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    disabled={!isEditing}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Chuyên khoa</Label>
                  <Select
                    value={profile.specialty}
                    onValueChange={(value) => setValue('specialty', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nội khoa">Nội khoa</SelectItem>
                      <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                      <SelectItem value="Sản phụ khoa">Sản phụ khoa</SelectItem>
                      <SelectItem value="Da liễu">Da liễu</SelectItem>
                      <SelectItem value="Răng hàm mặt">Răng hàm mặt</SelectItem>
                      <SelectItem value="Mắt">Mắt</SelectItem>
                      <SelectItem value="Tai mũi họng">Tai mũi họng</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.specialty && (
                    <p className="text-sm text-red-500">{errors.specialty.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  {...register('address')}
                  disabled={!isEditing}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Kinh nghiệm</Label>
                <Input
                  id="experience"
                  placeholder="Ví dụ: 5 năm kinh nghiệm"
                  {...register('experience')}
                  disabled={!isEditing}
                />
                {errors.experience && (
                  <p className="text-sm text-red-500">{errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Mô tả về bản thân và chuyên môn..."
                  {...register('bio')}
                  disabled={!isEditing}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Hủy
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}