import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DoctorSchedule, Doctor } from '@/types'

interface ScheduleFormProps {
  schedule?: DoctorSchedule
  doctors?: Doctor[]
  isLoading?: boolean
  onSubmit: (data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel?: () => void
}

export function ScheduleForm({ schedule, doctors = [], isLoading = false, onSubmit, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    doctorId: schedule?.doctorId || '',
    date: schedule?.date || '',
    startTime: schedule?.startTime || '08:00',
    endTime: schedule?.endTime || '09:00',
    maxPatients: schedule?.maxPatients || 5,
    isAvailable: schedule?.isAvailable !== false,
    notes: schedule?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.doctorId) {
      newErrors.doctorId = 'Vui lòng chọn bác sĩ'
    }
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày'
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng nhập giờ bắt đầu'
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng nhập giờ kết thúc'
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu'
    }
    if (formData.maxPatients < 1) {
      newErrors.maxPatients = 'Số bệnh nhân tối thiểu là 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      await onSubmit({
        doctorId: formData.doctorId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxPatients: formData.maxPatients,
        isAvailable: formData.isAvailable,
        notes: formData.notes || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div className="space-y-2">
          <Label htmlFor="doctor">Chọn Bác Sĩ *</Label>
          <Select value={formData.doctorId} onValueChange={(value) => handleChange('doctorId', value)}>
            <SelectTrigger id="doctor" className={errors.doctorId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Chọn bác sĩ" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.doctorId && <p className="text-sm text-red-500">{errors.doctorId}</p>}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Ngày Khám *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={errors.date ? 'border-red-500' : ''}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Giờ Bắt Đầu *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              className={errors.startTime ? 'border-red-500' : ''}
            />
            {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Giờ Kết Thúc *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              className={errors.endTime ? 'border-red-500' : ''}
            />
            {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
          </div>
        </div>

        {/* Max Patients */}
        <div className="space-y-2">
          <Label htmlFor="maxPatients">Số Bệnh Nhân Tối Đa *</Label>
          <Input
            id="maxPatients"
            type="number"
            min="1"
            max="20"
            value={formData.maxPatients}
            onChange={(e) => handleChange('maxPatients', parseInt(e.target.value))}
            className={errors.maxPatients ? 'border-red-500' : ''}
          />
          {errors.maxPatients && <p className="text-sm text-red-500">{errors.maxPatients}</p>}
        </div>

        {/* Available */}
        <div className="flex items-center space-x-2">
          <input
            id="isAvailable"
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => handleChange('isAvailable', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="isAvailable" className="font-normal cursor-pointer">
            Lịch Khám Có Sẵn
          </Label>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Ghi Chú</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Nhập ghi chú (tuỳ chọn)"
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || isLoading}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting || isLoading}>
            {submitting || isLoading ? 'Đang Lưu...' : schedule ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
