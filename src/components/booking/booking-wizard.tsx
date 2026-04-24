import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/services/api'
import type { BookingFormData, Doctor, Specialty } from '@/types'

const steps = [
  { id: 1, name: 'Chọn chuyên khoa', shortName: 'Chuyên khoa' },
  { id: 2, name: 'Chọn bác sĩ', shortName: 'Bác sĩ' },
  { id: 3, name: 'Chọn thời gian', shortName: 'Thời gian' },
  { id: 4, name: 'Thông tin bệnh nhân', shortName: 'Thông tin' },
]

export function BookingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    specialtyId: '',
    doctorId: '',
    date: '',
    time: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: '',
  })

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch specialties and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [doctorsData, specialtiesData] = await Promise.all([
          api.doctors.getAll(),
          api.specialties.getAll(),
        ])
        setDoctors(doctorsData)
        setSpecialties(specialtiesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Pre-fill from URL params if coming from doctor detail page
  useEffect(() => {
    const doctorId = searchParams.get('doctor')
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (doctorId && doctors.length > 0) {
      const doctor = doctors.find((d) => d.id === doctorId)
      if (doctor) {
        setFormData((prev) => ({
          ...prev,
          specialtyId: doctor.specialtySlug,
          doctorId: doctor.id,
          date: date || '',
          time: time || '',
        }))
        // Skip to step 3 or 4 if date/time are provided
        if (date && time) {
          setCurrentStep(4)
        } else if (date) {
          setCurrentStep(3)
        } else {
          setCurrentStep(3)
        }
      }
    }
  }, [searchParams, doctors])

  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId)
  const filteredDoctors = formData.specialtyId
    ? doctors.filter((d) => d.specialtySlug === formData.specialtyId)
    : doctors

  const selectedSlot = selectedDoctor?.availableSlots.find(
    (slot) => slot.date === formData.date
  )

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.specialtyId
      case 2:
        return !!formData.doctorId
      case 3:
        return !!formData.date && !!formData.time
      case 4:
        return (
          !!formData.patientName &&
          !!formData.patientPhone &&
          !!formData.patientEmail
        )
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit booking
      navigate('/booking/confirm')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Lỗi: {error}</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Steps indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center hidden sm:block ${
                      currentStep >= step.id
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.shortName}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 sm:w-20 md:w-32 mx-2 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Select Specialty */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Chọn chuyên khoa
                  </h2>
                  <p className="text-muted-foreground">
                    Chọn chuyên khoa phù hợp với tình trạng sức khỏe của bạn
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => (
                    <button
                      key={specialty.id}
                      onClick={() =>
                        setFormData({ ...formData, specialtyId: specialty.slug, doctorId: '' })
                      }
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.specialtyId === specialty.slug
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">
                        {specialty.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {specialty.doctorCount} bác sĩ
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Doctor */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Chọn bác sĩ
                  </h2>
                  <p className="text-muted-foreground">
                    Chọn bác sĩ bạn muốn đặt lịch khám
                  </p>
                </div>

                <div className="space-y-3">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() =>
                        setFormData({ ...formData, doctorId: doctor.id, date: '', time: '' })
                      }
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        formData.doctorId === doctor.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-primary">
                            {doctor.name.split(' ').pop()?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">
                            {doctor.name}
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {doctor.specialty} - {doctor.experience} năm KN
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-yellow-500">★</span>
                            <span>{doctor.rating}</span>
                            <span className="text-muted-foreground">
                              ({doctor.reviewCount} đánh giá)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-semibold">
                            {formatCurrency(doctor.consultationFee)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Date/Time */}
            {currentStep === 3 && selectedDoctor && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Chọn thời gian khám
                  </h2>
                  <p className="text-muted-foreground">
                    Chọn ngày và giờ phù hợp với lịch của bạn
                  </p>
                </div>

                {/* Date Selection */}
                <div>
                  <Label className="mb-3 block">Chọn ngày</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedDoctor.availableSlots.map((slot) => (
                      <button
                        key={slot.date}
                        onClick={() =>
                          setFormData({ ...formData, date: slot.date, time: '' })
                        }
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.date === slot.date
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">
                          {new Date(slot.date).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                          })}
                        </div>
                        <div className="text-lg font-semibold text-foreground">
                          {new Date(slot.date).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tháng {new Date(slot.date).getMonth() + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedSlot && (
                  <div>
                    <Label className="mb-3 block">Chọn giờ</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {selectedSlot.times.map((time) => (
                        <button
                          key={time}
                          onClick={() => setFormData({ ...formData, time })}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            formData.time === time
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Patient Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Thông tin bệnh nhân
                  </h2>
                  <p className="text-muted-foreground">
                    Điền thông tin để hoàn tất đặt lịch
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      placeholder="Nhập họ và tên"
                      value={formData.patientName}
                      onChange={(e) =>
                        setFormData({ ...formData, patientName: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0901234567"
                      value={formData.patientPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, patientPhone: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.patientEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, patientEmail: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú (triệu chứng, lý do khám)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Mô tả triệu chứng hoặc lý do khám..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                {currentStep === 4 ? 'Xác nhận đặt lịch' : 'Tiếp tục'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Booking Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Thông tin đặt lịch
            </h3>

            <div className="space-y-4">
              {/* Specialty */}
              {formData.specialtyId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chuyên khoa</span>
                  <span className="font-medium text-foreground">
                    {specialties.find((s) => s.slug === formData.specialtyId)?.name}
                  </span>
                </div>
              )}

              {/* Doctor */}
              {selectedDoctor && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bác sĩ</span>
                  <span className="font-medium text-foreground">
                    {selectedDoctor.name}
                  </span>
                </div>
              )}

              {/* Date */}
              {formData.date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày khám</span>
                  <span className="font-medium text-foreground">
                    {formatDate(formData.date)}
                  </span>
                </div>
              )}

              {/* Time */}
              {formData.time && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giờ khám</span>
                  <span className="font-medium text-foreground">{formData.time}</span>
                </div>
              )}

              {/* Price */}
              {selectedDoctor && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phí khám</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(selectedDoctor.consultationFee)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Empty state */}
              {!formData.specialtyId && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chọn chuyên khoa để bắt đầu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
