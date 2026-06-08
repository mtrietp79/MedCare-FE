import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientAvatar, PatientPageHeader } from '@/components/patient/patient-ui'
import { api } from '@/services/api'
import type { Patient } from '@/types'

const genders = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

interface PatientProfileFormProps {
  patient: Patient
  onSuccess?: (updated: Patient) => void
  onCancel?: () => void
}

export function PatientProfileForm({ patient, onSuccess, onCancel }: PatientProfileFormProps) {
  const [formData, setFormData] = useState<{
    fullName: string
    dateOfBirth: string
    phone: string
    email: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    nationalId: string
    address: string
  }>({
    fullName: patient.fullName || patient.name || '',
    dateOfBirth: patient.dateOfBirth || '',
    phone: patient.phone || '',
    email: patient.email || '',
    gender: patient.gender || 'MALE',
    nationalId: patient.nationalId || '',
    address: patient.address || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser } = useAuth()

  useEffect(() => {
    setFormData({
      fullName: patient.fullName || patient.name || '',
      dateOfBirth: patient.dateOfBirth || '',
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender || 'MALE',
      nationalId: patient.nationalId || '',
      address: patient.address || '',
    })
  }, [patient])

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
      const updatedPatient = await api.patients.updateCurrent(formData)
      await refreshUser()
      setMessage('Cập nhật hồ sơ thành công.')
      onSuccess?.(updatedPatient)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({
              ...formData,
              gender: value as 'MALE' | 'FEMALE' | 'OTHER',
            })}
          >
            <SelectTrigger id="gender" className="w-full">
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
        <div className="space-y-2">
          <Label htmlFor="nationalId">CMND/CCCD *</Label>
          <Input
            id="nationalId"
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="min-h-[100px]"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Bỏ qua
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export function PatientProfilePage() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await api.patients.getCurrent()
        setPatient(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <div className="space-y-6">
      <PatientPageHeader
        title="Hồ sơ bệnh nhân"
        description="Hoàn thiện thông tin của bạn để tiếp tục đặt lịch khám."
      />

      <Card>
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Đang tải dữ liệu hồ sơ...</div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">{error}</div>
          ) : patient ? (
            <div className="space-y-8">
              <div className="flex flex-col items-center gap-4 border-b border-border/60 pb-8 sm:flex-row sm:items-start">
                <PatientAvatar name={patient.fullName || patient.name} size="xl" />
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{patient.fullName || patient.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{patient.email || 'Chưa cập nhật email'}</p>
                  <p className="text-sm text-muted-foreground">{patient.phone || 'Chưa cập nhật SĐT'}</p>
                </div>
              </div>
              <PatientProfileForm
                patient={patient}
                onSuccess={() => navigate('/patient')}
                onCancel={() => navigate('/patient')}
              />
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">Không tìm thấy hồ sơ.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
