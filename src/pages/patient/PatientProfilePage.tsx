import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/services/api'
import type { Patient } from '@/types'

const genders = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

export function PatientProfilePage() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    gender: 'MALE',
    nationalId: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await api.patients.getCurrent()
        setPatient(data)
        setFormData({
          fullName: data.fullName || data.name || '',
          dateOfBirth: data.dateOfBirth || '',
          phone: data.phone || '',
          email: data.email || '',
          gender: data.gender || 'MALE',
          nationalId: data.nationalId || '',
          address: data.address || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const validate = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.phone || !formData.gender || !formData.nationalId || !formData.address) {
      return 'Vui lòng điền đầy đủ các trường bắt buộc.'
    }

    if (!/^\d{12}$/.test(formData.nationalId)) {
      return 'CMND/CCCD phải đủ 12 chữ số.'
    }

    if (!/^0\d{9}$/.test(formData.phone)) {
      return 'Số điện thoại phải đúng định dạng VN.'
    }

    return null
  }

  const { refreshUser } = useAuth()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await api.patients.updateCurrent(formData)
      await refreshUser()
      setMessage('Cập nhật hồ sơ thành công.')
      setTimeout(() => navigate('/patient'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Hồ sơ bệnh nhân</h1>
        <p className="text-sm text-muted-foreground">Hoàn thiện thông tin của bạn để tiếp tục đặt lịch khám.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Đang tải dữ liệu hồ sơ...</div>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="gender">Giới tính *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger id="gender" className="mt-2 w-full">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nationalId">CMND/CCCD *</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa chỉ *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-2"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </Button>
        </form>
      )}
    </div>
  )
}
