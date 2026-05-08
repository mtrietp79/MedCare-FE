import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, GraduationCap, Award } from 'lucide-react'

export function DoctorProfilePage() {
  const [isEditing, setIsEditing] = useState(false)

  const profile = {
    name: 'Dr. Nguyễn Văn Minh',
    email: 'nguyenminh@medcare.vn',
    phone: '+84 123 456 789',
    specialty: 'Nội khoa',
    experience: '10 năm',
    education: 'Đại học Y Hà Nội',
    certifications: ['Chứng chỉ nội khoa', 'Chứng chỉ tim mạch'],
    bio: 'Bác sĩ chuyên khoa nội khoa với hơn 10 năm kinh nghiệm trong việc chẩn đoán và điều trị các bệnh lý nội khoa.',
    avatar: '/placeholder-avatar.jpg'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và chuyên môn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{profile.name}</CardTitle>
            <CardDescription>{profile.specialty}</CardDescription>
            <Badge variant="secondary" className="mt-2">{profile.experience} kinh nghiệm</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Hà Nội, Việt Nam</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Thông tin chi tiết</CardTitle>
                <CardDescription>Cập nhật thông tin chuyên môn và cá nhân</CardDescription>
              </div>
              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue={profile.name} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={profile.email} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" defaultValue={profile.phone} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Chuyên khoa</Label>
                <Select disabled={!isEditing}>
                  <SelectTrigger>
                    <SelectValue placeholder={profile.specialty} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Nội khoa</SelectItem>
                    <SelectItem value="cardiology">Tim mạch</SelectItem>
                    <SelectItem value="dermatology">Da liễu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Học vấn</Label>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <Input id="education" defaultValue={profile.education} disabled={!isEditing} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chứng chỉ</Label>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <Award className="h-3 w-3" />
                    <span>{cert}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Tiểu sử</Label>
              <Textarea
                id="bio"
                defaultValue={profile.bio}
                disabled={!isEditing}
                rows={4}
              />
            </div>

            {isEditing && (
              <div className="flex space-x-2">
                <Button>Lưu thay đổi</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}