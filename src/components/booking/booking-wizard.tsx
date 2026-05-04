import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import type { BookingFormData, Doctor, Patient, Specialty } from '@/types'

const steps = [
  { id: 1, name: 'Chọn chuyên khoa', shortName: 'Chuyên khoa' },
  { id: 2, name: 'Chọn bác sĩ', shortName: 'Bác sĩ' },
  { id: 3, name: 'Chọn thời gian', shortName: 'Thời gian' },
  { id: 4, name: 'Xác nhận', shortName: 'Xác nhận' },
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
  const [patient, setPatient] = useState<Patient | null>(null)
  const [slots, setSlots] = useState<Array<{ startTime: string; endTime: string; shift: string; maxPatients: number; bookedPatients: number; full: boolean; disabled: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [doctorsData, specialtiesData, patientData] = await Promise.all([
          api.doctors.getAll(),
          api.specialties.getAll(),
          api.patients.getCurrent(),
        ])
        setDoctors(doctorsData)
        setSpecialties(specialtiesData)
        setPatient(patientData)
        setFormData((prev) => ({
          ...prev,
          patientName: patientData.fullName || patientData.name || '',
          patientPhone: patientData.phone || '',
          patientEmail: patientData.email || '',
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
        console.error('Error fetching booking data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const doctorId = searchParams.get('doctor')
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (doctorId && doctors.length > 0) {
      const doctor = doctors.find((d) => d.id === doctorId)
      if (doctor) {
        setFormData((prev) => ({
          ...prev,
          specialtyId: doctor.specialtySlug || '',
          doctorId: doctor.id,
          date: date || prev.date,
          time: time || prev.time,
        }))
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
        setSlots(data)
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

  const selectedSpecialty = specialties.find((item) => item.id === formData.specialtyId)
  const filteredDoctors = formData.specialtyId
    ? doctors.filter(
        (doctor) =>
          doctor.specialty === selectedSpecialty?.name || doctor.specialtySlug === selectedSpecialty?.slug
      )
    : doctors

  const selectedDoctor = doctors.find((doctor) => doctor.id === formData.doctorId)
  const selectedSlot = slots.find((slot) => slot.startTime === formData.time)

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.specialtyId
      case 2:
        return !!formData.doctorId
      case 3:
        return !!formData.date && !!formData.time
      case 4:
        return !!patient
      default:
        return false
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const submitBooking = async () => {
    if (!selectedDoctor || !selectedSpecialty || !selectedSlot) {
      setSubmitError('Vui lòng hoàn thành đầy đủ thông tin đặt lịch.')
      return
    }

    try {
      setSubmitLoading(true)
      setSubmitError(null)
      const appointment = await api.appointments.create({
        specialty: { id: selectedSpecialty.id },
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
      <div className="lg:col-span-2">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`mt-2 text-xs text-center hidden sm:block ${currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.shortName}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-20 md:w-32 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Chọn chuyên khoa</h2>
                  <p className="text-muted-foreground">Chọn chuyên khoa phù hợp với tình trạng của bạn.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((specialty) => (
                    <button
                      key={specialty.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          specialtyId: specialty.id,
                          doctorId: '',
                          date: '',
                          time: '',
                        })
                        setCurrentStep(2)
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.specialtyId === specialty.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">{specialty.name}</div>
                      <div className="text-sm text-muted-foreground">{specialty.doctorCount ?? 'Đa dạng'} bác sĩ</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Chọn bác sĩ</h2>
                  <p className="text-muted-foreground">Chọn bác sĩ bạn muốn đặt lịch khám.</p>
                </div>
                <div className="space-y-3">
                  {filteredDoctors.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground">Chưa có bác sĩ trong chuyên khoa này.</div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, doctorId: doctor.id, date: '', time: '' })
                          setCurrentStep(3)
                        }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          formData.doctorId === doctor.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-primary">{doctor.name.split(' ').pop()?.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground">{doctor.name}</div>
                            <p className="text-sm text-muted-foreground mb-1">{doctor.specialty} • {doctor.experience ?? 0} năm KN</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-yellow-500">★</span>
                              <span>{doctor.rating ?? '0.0'}</span>
                              <span className="text-muted-foreground">({doctor.reviewCount ?? 0} đánh giá)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-primary font-semibold">{doctor.consultationFee ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doctor.consultationFee) : 'Liên hệ'}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Chọn thời gian khám</h2>
                  <p className="text-muted-foreground">Chọn ngày và giờ phù hợp với lịch của bác sĩ.</p>
                </div>
                {!selectedDoctor ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground">Vui lòng chọn bác sĩ trước.</div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="appointment-date">Ngày khám</Label>
                      <Input
                        id="appointment-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                        className="mt-2"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {slotsLoading ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground">Đang tải khung giờ...</div>
                    ) : formData.date ? (
                      <>
                        {slotsError ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-destructive">{slotsError}</div>
                        ) : slots.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground">Chưa có khung giờ khả dụng cho ngày này.</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {slots.map((slot) => (
                              <button
                                key={slot.startTime}
                                type="button"
                                disabled={slot.full || slot.disabled}
                                onClick={() => setFormData({ ...formData, time: slot.startTime })}
                                className={`rounded-xl border p-4 text-left transition-all ${
                                  formData.time === slot.startTime
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                                } ${slot.full || slot.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-semibold text-foreground">{new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-xs text-muted-foreground">{slot.shift}</div>
                                  </div>
                                  <span className="text-sm font-medium">{slot.full ? 'Đã đầy' : 'Còn chỗ'}</span>
                                </div>
                                <div className="mt-3 text-sm text-muted-foreground">{slot.bookedPatients}/{slot.maxPatients} người</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Xác nhận thông tin</h2>
                  <p className="text-muted-foreground">Kiểm tra thông tin và hoàn tất đặt lịch.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border p-5">
                    <p className="text-sm text-muted-foreground">Họ và tên</p>
                    <p className="mt-2 font-medium">{patient?.fullName || patient?.name || 'Không có dữ liệu'}</p>
                  </div>
                  <div className="rounded-3xl border p-5">
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="mt-2 font-medium">{patient?.phone || 'Không có dữ liệu'}</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Triệu chứng / ghi chú</Label>
                  <Textarea
                    id="notes"
                    placeholder="Mô tả ngắn gọn triệu chứng hoặc lý do khám"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-2"
                    rows={5}
                  />
                </div>
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
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
                className="gap-2"
              >
                {currentStep === 4 ? (submitLoading ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch') : 'Tiếp tục'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Tóm tắt đặt lịch</h3>
            <div className="space-y-4 text-sm text-slate-700">
              {formData.specialtyId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chuyên khoa</span>
                  <span className="font-medium">{selectedSpecialty?.name}</span>
                </div>
              )}
              {selectedDoctor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bác sĩ</span>
                  <span className="font-medium">{selectedDoctor.name}</span>
                </div>
              )}
              {formData.date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày</span>
                  <span className="font-medium">{new Date(formData.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {formData.time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giờ</span>
                  <span className="font-medium">{new Date(formData.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {selectedDoctor?.consultationFee && (
                <div className="border-t pt-4 mt-4 flex justify-between">
                  <span className="text-muted-foreground">Phí khám</span>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(selectedDoctor.consultationFee)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
