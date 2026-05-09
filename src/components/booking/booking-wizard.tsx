import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import type { Doctor, Patient } from '@/types'

const steps = [
  { id: 1, name: 'Chọn bác sĩ' },
  { id: 2, name: 'Chọn ngày & giờ' },
  { id: 3, name: 'Thông tin bệnh nhân' },
  { id: 4, name: 'Xác nhận' },
]

interface BookingFormState {
  doctorId: string
  date: string
  time: string
  patientName: string
  patientPhone: string
  patientEmail: string
  notes: string
}

export function BookingWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormState>({
    doctorId: '',
    date: '',
    time: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: '',
  })

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [doctorsData, patientData] = await Promise.all([
          api.doctors.getAll(),
          api.patients.getCurrent().catch(() => null),
        ])
        setDoctors(doctorsData)
        setPatient(patientData)
        if (patientData) {
          setFormData(prev => ({
            ...prev,
            patientName: patientData.fullName || patientData.name || '',
            patientPhone: patientData.phone || '',
            patientEmail: patientData.email || '',
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
        console.error('Error fetching booking data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch available slots when doctor and date change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.doctorId || !formData.date) {
        setSlots([])
        return
      }

      try {
        setSlotsError(null)
        setSlotsLoading(true)
        const data = await api.doctors.getAvailableSlots(formData.doctorId, formData.date)
        setSlots(data || [])
        if (!data || data.length === 0) {
          setSlotsError('Không có khung giờ khả dụng cho ngày này.')
        }
      } catch (err) {
        setSlotsError(err instanceof Error ? err.message : 'Không thể tải khung giờ')
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    fetchSlots()
  }, [formData.doctorId, formData.date])

  const selectedDoctor = (Array.isArray(doctors) ? doctors : []).find(doc => doc.id === formData.doctorId)
  const selectedSlot = (Array.isArray(slots) ? slots : []).find(slot => slot.startTime === formData.time)

  const getDoctorName = (doctor?: Doctor) => doctor?.name ?? doctor?.fullName ?? 'Bác sĩ'
  const getDoctorSpecialty = (specialty?: Doctor['specialty']) =>
    typeof specialty === 'string' ? specialty : specialty?.name ?? ''

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.doctorId
      case 2:
        return !!formData.date && !!formData.time
      case 3:
        return !!formData.patientName && !!formData.patientPhone && !!formData.patientEmail
      case 4:
        return true
      default:
        return false
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const submitBooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setSubmitError('Vui lòng hoàn thành đầy đủ thông tin đặt lịch.')
      return
    }

    try {
      setSubmitLoading(true)
      setSubmitError(null)
      
      // Find specialty from doctor
      const specialty = selectedDoctor.specialty
      
      const appointment = await api.appointments.create({
        specialty: { id: selectedDoctor.specialty || '' },
        doctor: { id: selectedDoctor.id },
        appointmentDate: selectedSlot.startTime,
        symptoms: formData.notes,
      })
      navigate(`/patient/appointments/${appointment.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể đặt lịch khám')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">Lỗi: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-6 h-6" /> : step.id}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
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
          <CardContent className="p-8">
            {/* Step 1: Choose Doctor */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chọn bác sĩ</h2>
                  <p className="text-muted-foreground">Tìm và chọn bác sĩ phù hợp với nhu cầu của bạn</p>
                </div>

                {doctors.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">Không có bác sĩ khả dụng</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                    {(Array.isArray(doctors) ? doctors : []).map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, doctorId: doctor.id, date: '', time: '' })
                          setCurrentStep(2)
                        }}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          formData.doctorId === doctor.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg text-primary">
                            {getDoctorName(doctor).split(' ').pop()?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-lg">{getDoctorName(doctor)}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getDoctorSpecialty(doctor.specialty)} • {doctor.experience || 0} năm kinh nghiệm
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm">{doctor.rating || '0.0'}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({doctor.reviewCount || 0} đánh giá)
                                </span>
                              </div>
                            </div>
                          </div>
                          {doctor.consultationFee && (
                            <div className="text-right flex flex-col justify-center">
                              <p className="text-primary font-bold">{formatCurrency(doctor.consultationFee)}</p>
                              <p className="text-xs text-muted-foreground">/ lần khám</p>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Choose Date & Time */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chọn ngày & giờ khám</h2>
                  <p className="text-muted-foreground">Chọn ngày và khung giờ phù hợp</p>
                </div>

                {!selectedDoctor ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">Vui lòng chọn bác sĩ trước</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Doctor Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Bác sĩ được chọn</p>
                      <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <Label htmlFor="appointment-date" className="text-base font-semibold mb-2 block">
                        Ngày khám
                      </Label>
                      <Input
                        id="appointment-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value, time: '' })
                          setSlotsError(null)
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="text-base p-3 h-12"
                      />
                    </div>

                    {/* Time Selection */}
                    {formData.date && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Khung giờ khám
                        </Label>
                        {slotsLoading ? (
                          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-muted-foreground">Đang tải khung giờ...</p>
                          </div>
                        ) : slotsError ? (
                          <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
                            <p className="text-destructive font-medium">{slotsError}</p>
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                            <p className="text-muted-foreground">Không có khung giờ khả dụng cho ngày này</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {slots.map((slot) => (
                              <button
                                key={slot.startTime}
                                type="button"
                                disabled={slot.full || slot.disabled}
                                onClick={() => setFormData({ ...formData, time: slot.startTime })}
                                className={`p-4 rounded-lg border-2 text-center transition-all font-medium ${
                                  formData.time === slot.startTime
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                                } ${slot.full || slot.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                <div className="text-lg font-bold text-foreground">
                                  {new Date(slot.startTime).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {slot.full ? 'Đã đầy' : `Còn ${slot.maxPatients - slot.bookedPatients}/${slot.maxPatients}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Patient Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Thông tin bệnh nhân</h2>
                  <p className="text-muted-foreground">Cập nhật thông tin liên hệ của bạn</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="patient-name" className="text-base font-semibold mb-2 block">
                      Họ và tên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="patient-name"
                      placeholder="Nhập họ và tên"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="text-base p-3 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient-phone" className="text-base font-semibold mb-2 block">
                      Số điện thoại <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="patient-phone"
                      placeholder="Nhập số điện thoại"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      className="text-base p-3 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient-email" className="text-base font-semibold mb-2 block">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="patient-email"
                      type="email"
                      placeholder="Nhập email"
                      value={formData.patientEmail}
                      onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                      className="text-base p-3 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="symptoms" className="text-base font-semibold mb-2 block">
                      Triệu chứng / Ghi chú <span className="text-muted-foreground">(không bắt buộc)</span>
                    </Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Mô tả triệu chứng hoặc lý do khám..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={5}
                      className="text-base p-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Xác nhận thông tin đặt lịch</h2>
                  <p className="text-muted-foreground">Vui lòng kiểm tra lại thông tin trước khi xác nhận</p>
                </div>

                <div className="space-y-4">
                  {/* Doctor Info */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Thông tin bác sĩ</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Bác sĩ</span>
                          <span className="font-medium text-right">{selectedDoctor?.name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Chuyên khoa</span>
                          <span className="font-medium text-right">
                            {selectedDoctor ? getDoctorSpecialty(selectedDoctor.specialty) : '—'}
                          </span>
                        </div>
                        {selectedDoctor?.consultationFee && (
                          <div className="flex justify-between items-start pt-2 border-t">
                            <span className="text-muted-foreground">Phí khám</span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(selectedDoctor.consultationFee)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date & Time Info */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Ngày giờ khám</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Ngày</span>
                          <span className="font-medium text-right">
                            {formData.date
                              ? new Date(formData.date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Giờ</span>
                          <span className="font-medium text-right">
                            {formData.time
                              ? new Date(formData.time).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient Info */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Thông tin bệnh nhân</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Họ và tên</span>
                          <span className="font-medium text-right">{formData.patientName}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Số điện thoại</span>
                          <span className="font-medium text-right">{formData.patientPhone}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium text-right">{formData.patientEmail}</span>
                        </div>
                        {formData.notes && (
                          <div className="flex flex-col gap-2 pt-2 border-t">
                            <span className="text-muted-foreground">Triệu chứng / Ghi chú</span>
                            <p className="text-sm font-medium bg-muted/50 p-3 rounded text-foreground">
                              {formData.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {submitError && (
                    <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
                      <p className="text-destructive font-medium">{submitError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <Button
                onClick={async () => {
                  if (currentStep < 4) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    await submitBooking()
                  }
                }}
                disabled={!canProceed() || submitLoading}
                size="lg"
                className="gap-2"
              >
                {currentStep === 4 ? (
                  submitLoading ? (
                    <>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Xác nhận đặt lịch
                    </>
                  )
                ) : (
                  <>
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24 border-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg text-foreground mb-6">Tóm tắt đặt lịch</h3>
            <div className="space-y-5 text-sm">
              {/* Doctor Summary */}
              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bác sĩ</p>
                {selectedDoctor ? (
                  <div>
                    <p className="font-semibold text-foreground">{getDoctorName(selectedDoctor)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getDoctorSpecialty(selectedDoctor?.specialty)}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn</p>
                )}
              </div>

              {/* Date Summary */}
              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ngày</p>
                {formData.date ? (
                  <p className="font-semibold text-foreground">
                    {new Date(formData.date).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    })}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn</p>
                )}
              </div>

              {/* Time Summary */}
              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Giờ</p>
                {formData.time ? (
                  <p className="font-semibold text-foreground">
                    {new Date(formData.time).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn</p>
                )}
              </div>

              {/* Fee Summary */}
              {selectedDoctor?.consultationFee && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tổng phí</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedDoctor.consultationFee)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
