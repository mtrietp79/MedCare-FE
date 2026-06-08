import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PatientProfileForm } from '@/pages/patient/PatientProfilePage'
import { api, type ApiRequestError, type AppointmentSlot } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import type { BookingRules, Doctor, MedicalService, Patient } from '@/types'

type StepKey = 'specialty' | 'doctor' | 'schedule' | 'patient' | 'confirm'

interface BookingFormState {
  doctorId: string
  date: string
  time: string
  patientName: string
  patientPhone: string
  patientEmail: string
  notes: string
}

interface SlotItem extends AppointmentSlot {}

const SLOT_DISABLED_REASONS = new Set(['PAST', 'LESS_THAN_2H', 'FULL', 'TOO_FAR'])

const isRequiredProfileFieldFilled = (value?: string | null) => Boolean(value && String(value).trim())

const isPatientProfileCompleted = (patient?: Patient | null) => {
  if (!patient) return false
  if (patient.profileCompleted === true) return true

  return (
    isRequiredProfileFieldFilled(patient.fullName || patient.name) &&
    isRequiredProfileFieldFilled(patient.dateOfBirth) &&
    isRequiredProfileFieldFilled(patient.phone) &&
    isRequiredProfileFieldFilled(patient.gender) &&
    isRequiredProfileFieldFilled(patient.nationalId) &&
    isRequiredProfileFieldFilled(patient.address)
  )
}

export function BookingWizard() {
  const location = useLocation()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<StepKey>('specialty')
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
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null)
  const [showAllSpecialties, setShowAllSpecialties] = useState(false)
  const [selectedMedicalService, setSelectedMedicalService] = useState<MedicalService | null>(null)
  const [bookingRules, setBookingRules] = useState<BookingRules | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [patientProfileLoading, setPatientProfileLoading] = useState(false)
  const [patientProfileError, setPatientProfileError] = useState<string | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const queryDoctorId = searchParams.get('doctor')
  const queryServiceId = searchParams.get('serviceId')
  const stateMedicalService = (location.state as { medicalService?: MedicalService } | null)?.medicalService

  const isServiceBooking = Boolean(selectedMedicalService?.id)
  const assignedDoctorFromService = selectedMedicalService?.assignedDoctor

  const activeSteps = useMemo<Array<{ id: StepKey; name: string }>>(() => {
    if (isServiceBooking) {
      return [
        { id: 'schedule', name: 'Chọn ngày & giờ' },
        { id: 'patient', name: 'Thông tin bệnh nhân' },
        { id: 'confirm', name: 'Xác nhận' },
      ]
    }

    return [
      { id: 'specialty', name: 'Chọn chuyên khoa' },
      { id: 'doctor', name: 'Chọn bác sĩ' },
      { id: 'schedule', name: 'Chọn ngày & giờ' },
      { id: 'patient', name: 'Thông tin bệnh nhân' },
      { id: 'confirm', name: 'Xác nhận' },
    ]
  }, [isServiceBooking])

  const currentStepIndex = useMemo(
    () => Math.max(0, activeSteps.findIndex((step) => step.id === currentStep)),
    [activeSteps, currentStep]
  )

  const DEFAULT_SPECIALTY_VISIBLE_COUNT = 6
  const hasHiddenSpecialties = specialties.length > DEFAULT_SPECIALTY_VISIBLE_COUNT
  const visibleSpecialties = useMemo(() => {
    if (showAllSpecialties || !hasHiddenSpecialties) {
      return specialties
    }

    if (!selectedSpecialtyId) {
      return specialties.slice(0, DEFAULT_SPECIALTY_VISIBLE_COUNT)
    }

    const selectedIndex = specialties.findIndex((specialty) => specialty.id === selectedSpecialtyId)
    if (selectedIndex < 0 || selectedIndex < DEFAULT_SPECIALTY_VISIBLE_COUNT) {
      return specialties.slice(0, DEFAULT_SPECIALTY_VISIBLE_COUNT)
    }

    const pinned = specialties[selectedIndex]
    return [...specialties.slice(0, DEFAULT_SPECIALTY_VISIBLE_COUNT - 1), pinned]
  }, [hasHiddenSpecialties, selectedSpecialtyId, showAllSpecialties, specialties])

  const syncPatientIntoBookingForm = useCallback((patientData: Patient | null) => {
    if (!patientData) return

    setFormData((prev) => ({
      ...prev,
      patientName: patientData.fullName || patientData.name || prev.patientName,
      patientPhone: patientData.phone || prev.patientPhone,
      patientEmail: patientData.email || prev.patientEmail,
    }))
  }, [])

  const loadCurrentPatient = useCallback(async () => {
    try {
      setPatientProfileLoading(true)
      setPatientProfileError(null)
      const data = await api.patients.getCurrent()
      setPatient(data)
      syncPatientIntoBookingForm(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải hồ sơ bệnh nhân'
      setPatientProfileError(message)
      return null
    } finally {
      setPatientProfileLoading(false)
    }
  }, [syncPatientIntoBookingForm])

  const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day, 0, 0, 0, 0)
      return Number.isNaN(date.getTime()) ? null : date
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/')
      const date = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
      return Number.isNaN(date.getTime()) ? null : date
    }
    const parsed = new Date(dateString)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const toDateOnly = (value: Date) => {
    const next = new Date(value)
    next.setHours(0, 0, 0, 0)
    return next
  }

  const formatDateDisplay = (dateString?: string) => {
    const date = parseDateString(dateString || '')
    return date ? date.toLocaleDateString('vi-VN') : ''
  }

  const formatDateAsIso = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTimeDisplay = (timeString?: string) => {
    if (!timeString) return ''
    const date = parseDateString(timeString)
    return date
      ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : ''
  }

  const normalizeDisabledReason = (reason?: string | null) => String(reason || '').trim().toUpperCase()

  const getDoctorName = (doctor?: Doctor | null) => doctor?.name ?? doctor?.fullName ?? 'Bác sĩ'
  const getDoctorSpecialty = (specialty?: Doctor['specialty']) =>
    typeof specialty === 'string' ? specialty : specialty?.name ?? ''
  const getDoctorExperienceYears = (doctor?: Doctor) => {
    const raw = doctor?.experienceYears ?? (doctor as any)?.yearsExperience ?? doctor?.experience ?? 0
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const getSlotDisabledMessage = (reason?: string | null) => {
    switch (normalizeDisabledReason(reason)) {
      case 'PAST':
        return 'Khung giờ đã qua.'
      case 'LESS_THAN_2H':
        return 'Chỉ được đặt trước ít nhất 2 giờ.'
      case 'FULL':
        return 'Khung giờ đã đầy.'
      case 'TOO_FAR':
        return 'Ngày hẹn vượt quá giới hạn cho phép.'
      default:
        return ''
    }
  }

  const isSelectedSlotBookable = (slot?: SlotItem | null) =>
    Boolean(
      slot &&
      !slot.disabled &&
      !slot.full &&
      !SLOT_DISABLED_REASONS.has(normalizeDisabledReason(slot.disabledReason))
    )

  const selectedDoctor = useMemo<Doctor | null>(() => {
    if (assignedDoctorFromService?.id) {
      return {
        id: String(assignedDoctorFromService.id),
        fullName: assignedDoctorFromService.fullName,
        name: assignedDoctorFromService.fullName,
        specialty: assignedDoctorFromService.specialty ?? selectedMedicalService?.specialty,
        consultationFee: assignedDoctorFromService.price,
        price: assignedDoctorFromService.price,
      }
    }

    return (Array.isArray(doctors) ? doctors : []).find((doc) => doc.id === formData.doctorId) || null
  }, [assignedDoctorFromService, doctors, formData.doctorId, selectedMedicalService?.specialty])

  const minDateString =
    bookingRules?.minBookableAt?.split('T')[0] ||
    bookingRules?.serverNow?.split('T')[0] ||
    new Date().toISOString().split('T')[0]
  const maxDateString = bookingRules?.maxBookableDate || ''

  const minSelectableDate = useMemo(() => {
    const parsed = parseDateString(minDateString)
    return toDateOnly(parsed || new Date())
  }, [minDateString])

  const maxSelectableDate = useMemo(() => {
    const parsed = parseDateString(maxDateString)
    if (!parsed) return null
    return toDateOnly(parsed)
  }, [maxDateString])

  const isDateOutOfRange = useCallback(
    (value: Date) => {
      const selectedDate = toDateOnly(value)
      if (selectedDate < minSelectableDate) return true
      if (maxSelectableDate && selectedDate > maxSelectableDate) return true
      return false
    },
    [maxSelectableDate, minSelectableDate]
  )

  const bookingDateRangeLabel = useMemo(() => {
    const minLabel = formatDateDisplay(minDateString)
    const maxLabel = maxSelectableDate ? maxSelectableDate.toLocaleDateString('vi-VN') : ''

    if (minLabel && maxLabel) {
      return `Bạn có thể đặt lịch từ ${minLabel} đến ${maxLabel}.`
    }

    if (minLabel) {
      return `Bạn có thể đặt lịch từ ${minLabel}.`
    }

    return null
  }, [maxSelectableDate, minDateString])

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [slots]
  )

  const needsProfileCompletion = !isPatientProfileCompleted(patient)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [specialtiesData, patientData, bookingRulesData] = await Promise.all([
          api.specialties.getAll(),
          api.patients.getCurrent().catch(() => null),
          api.appointments.getBookingRules(),
        ])

        setSpecialties(
          Array.isArray(specialtiesData)
            ? specialtiesData.map((item) => ({ id: String(item.id), name: item.name }))
            : []
        )
        setPatient(patientData)
        setBookingRules(bookingRulesData)
        syncPatientIntoBookingForm(patientData)

        const serviceIdToLoad = queryServiceId || stateMedicalService?.id
        if (serviceIdToLoad) {
          let service = stateMedicalService ?? null
          if (!service || String(service.id) !== String(serviceIdToLoad)) {
            service = await api.medicalServices.getById(String(serviceIdToLoad))
          }

          setSelectedMedicalService(service)
          setSelectedSpecialtyId(service?.specialty?.id ? String(service.specialty.id) : null)
          setCurrentStep('schedule')

          if (service?.assignedDoctor?.id) {
            setFormData((prev) => ({ ...prev, doctorId: String(service.assignedDoctor?.id || '') }))
          }
          return
        }

        if (queryDoctorId) {
          try {
            const doctor = await api.doctors.getById(queryDoctorId)
            if (doctor) {
              const specialtyId =
                doctor.specialtyId ??
                (typeof doctor.specialty === 'object' ? doctor.specialty?.id : undefined)

              setSelectedSpecialtyId(specialtyId ? String(specialtyId) : null)

              if (specialtyId) {
                const list = await api.doctors.getBySpecialtyId(String(specialtyId))
                setDoctors(Array.isArray(list) ? list : [doctor])
              } else {
                setDoctors([doctor])
              }

              setFormData((prev) => ({ ...prev, doctorId: doctor.id }))
              setCurrentStep('schedule')
            }
          } catch (queryError) {
            console.error('Error loading doctor from query param', queryError)
          }
        }
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || fetchError?.message || 'Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [queryDoctorId, queryServiceId, stateMedicalService, syncPatientIntoBookingForm])

  useEffect(() => {
    if (!isServiceBooking) return
    if (currentStep === 'specialty' || currentStep === 'doctor') {
      setCurrentStep('schedule')
    }
  }, [currentStep, isServiceBooking])

  useEffect(() => {
    if (isServiceBooking || !selectedSpecialtyId) return

    const loadDoctorsBySpecialty = async () => {
      try {
        const list = await api.doctors.getBySpecialtyId(selectedSpecialtyId)
        setDoctors(Array.isArray(list) ? list : [])
      } catch (doctorError) {
        console.error('Failed to load doctors by specialty', doctorError)
        setDoctors([])
      }
    }

    void loadDoctorsBySpecialty()
  }, [isServiceBooking, selectedSpecialtyId])

  useEffect(() => {
    if (currentStep !== 'specialty') return
    setShowAllSpecialties(false)
  }, [currentStep])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.date) {
        setSlots([])
        setSelectedSlot(null)
        return
      }

      if (isServiceBooking) {
        if (!selectedMedicalService?.id) {
          setSlots([])
          setSelectedSlot(null)
          return
        }
      } else if (!formData.doctorId) {
        setSlots([])
        setSelectedSlot(null)
        return
      }

      try {
        setSlotsError(null)
        setSlotsLoading(true)

        const response = isServiceBooking
          ? await api.appointments.getMedicalServiceSlots(String(selectedMedicalService?.id), formData.date)
          : await api.appointments.getDoctorSlots(formData.doctorId, formData.date)

        const processed = (response || []).map((slot: any) => {
          const disabledReason = normalizeDisabledReason(slot.disabledReason)
          const isFull = Boolean(slot.full) || disabledReason === 'FULL'
          const disabledByReason = SLOT_DISABLED_REASONS.has(disabledReason)

          return {
            ...slot,
            full: isFull,
            disabled: Boolean(slot.disabled) || isFull || disabledByReason,
            disabledReason,
          }
        }) as SlotItem[]

        setSlots(processed)
      } catch (slotError: unknown) {
        const apiError = slotError as ApiRequestError
        console.error('[BookingWizard] Failed to fetch slots', {
          mode: isServiceBooking ? 'service' : 'doctor',
          doctorId: formData.doctorId,
          serviceId: selectedMedicalService?.id,
          inputDate: formData.date,
          status: apiError?.status,
          body: apiError?.data,
          message: apiError?.message,
        })
        setSlotsError(apiError?.message || 'Không thể tải khung giờ')
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    void fetchSlots()
  }, [formData.date, formData.doctorId, isServiceBooking, selectedMedicalService?.id])

  useEffect(() => {
    if (currentStep !== 'patient') return
    void loadCurrentPatient()
  }, [currentStep, loadCurrentPatient])

  const canProceed = () => {
    switch (currentStep) {
      case 'specialty':
        return Boolean(selectedSpecialtyId)
      case 'doctor':
        return Boolean(formData.doctorId)
      case 'schedule':
        return isSelectedSlotBookable(selectedSlot)
      case 'patient':
        if (needsProfileCompletion) return false
        return Boolean(formData.patientName && formData.patientPhone && formData.patientEmail)
      case 'confirm':
        return true
      default:
        return false
    }
  }

  const goToPreviousStep = () => {
    const prev = activeSteps[currentStepIndex - 1]
    if (prev) setCurrentStep(prev.id)
  }

  const goToNextStep = () => {
    const next = activeSteps[currentStepIndex + 1]
    if (next) setCurrentStep(next.id)
  }

  const submitBooking = async () => {
    if (!selectedSlot) {
      setSubmitError('Vui lòng chọn một khung giờ hợp lệ.')
      return
    }

    try {
      setSubmitLoading(true)
      setSubmitError(null)

      if (isServiceBooking && selectedMedicalService?.id) {
        const payload = {
          medicalService: { id: selectedMedicalService.id },
          appointmentDate: selectedSlot.startTime,
          symptoms: formData.notes,
        }

        const bookingResult = await api.appointments.book(payload)
        if (!bookingResult?.paymentUrl) {
          throw new Error(bookingResult?.message || 'Không nhận được đường dẫn thanh toán VNPay.')
        }

        window.location.href = bookingResult.paymentUrl
        return
      }

      if (!selectedDoctor) {
        setSubmitError('Vui lòng chọn bác sĩ trước khi đặt lịch.')
        return
      }

      let specialtyIdToSend = selectedSpecialtyId
      if (!specialtyIdToSend) {
        specialtyIdToSend =
          typeof selectedDoctor.specialty === 'string'
            ? (selectedDoctor.specialtyId ?? '')
            : (selectedDoctor.specialty?.id ?? selectedDoctor.specialtyId ?? '')
      }

      const appointmentPayload: any = {
        specialty: { id: String(specialtyIdToSend || '') },
        doctor: { id: selectedDoctor.id },
        appointmentDate: selectedSlot.startTime,
        symptoms: formData.notes,
      }

      const bookingResult = await api.appointments.book(appointmentPayload)
      if (!bookingResult?.paymentUrl) {
        throw new Error(bookingResult?.message || 'Không nhận được đường dẫn thanh toán VNPay.')
      }

      window.location.href = bookingResult.paymentUrl
    } catch (submitErrorValue: any) {
      const apiError = submitErrorValue as ApiRequestError
      if (apiError?.code === 'PROFILE_INCOMPLETE') {
        setSubmitError('Hồ sơ bệnh nhân chưa hoàn tất. Vui lòng cập nhật thông tin để tiếp tục.')
        setCurrentStep('patient')
        void loadCurrentPatient()
        return
      }

      const message =
        submitErrorValue?.response?.data?.message ||
        (submitErrorValue instanceof Error ? submitErrorValue.message : 'Không thể đặt lịch khám')
      setSubmitError(message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const renderSlotButton = (slot: SlotItem) => {
    const isBlocked = slot.disabled || slot.full
    const disabledMessage = slot.full ? 'Khung giờ đã đầy.' : getSlotDisabledMessage(slot.disabledReason)
    const button = (
      <button
        key={slot.startTime}
        type="button"
        disabled={isBlocked}
        onClick={() => {
          if (isBlocked) return
          setFormData((prev) => ({ ...prev, time: slot.startTime }))
          setSelectedSlot(slot)
        }}
        className={`relative z-10 rounded-xl border-2 p-4 text-center font-medium transition-all ${
          selectedSlot?.startTime === slot.startTime
            ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm'
            : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
        } ${
          isBlocked
            ? 'cursor-not-allowed border-dashed bg-muted/50 opacity-60 grayscale'
            : ''
        }`}
      >
        <div className="text-lg font-bold text-foreground">{formatTimeDisplay(slot.startTime)}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {slot.full ? 'Đã đầy' : `Còn ${slot.maxPatients - slot.bookedPatients}/${slot.maxPatients}`}
        </div>
      </button>
    )

    return isBlocked && disabledMessage ? (
      <Tooltip key={slot.startTime}>
        <TooltipTrigger asChild>
          <span className="block">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top">{disabledMessage}</TooltipContent>
      </Tooltip>
    ) : (
      button
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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
      <div className="lg:col-span-2">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {activeSteps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStepIndex >= index
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStepIndex > index ? <Check className="w-6 h-6" /> : index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                      currentStepIndex >= index ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < activeSteps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 transition-all ${currentStepIndex > index ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {currentStep === 'specialty' && !isServiceBooking && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chọn chuyên khoa</h2>
                  <p className="text-muted-foreground">Chọn chuyên khoa trước để lọc danh sách bác sĩ</p>
                </div>

                {specialties.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">Không có chuyên khoa</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {visibleSpecialties.map((specialty) => (
                        <button
                          key={specialty.id}
                          type="button"
                          onClick={() => {
                            setSelectedSpecialtyId(specialty.id)
                            setFormData((prev) => ({ ...prev, doctorId: '', date: '', time: '' }))
                            setSelectedSlot(null)
                          }}
                          className={`p-4 rounded-lg border-2 text-center ${
                            selectedSpecialtyId === specialty.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {specialty.name}
                        </button>
                      ))}
                    </div>

                    {hasHiddenSpecialties && (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAllSpecialties((prev) => !prev)}
                          className="min-w-[140px]"
                        >
                          {showAllSpecialties ? 'Thu gọn' : 'Hiện thêm'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'doctor' && !isServiceBooking && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chọn bác sĩ</h2>
                  <p className="text-muted-foreground">Tìm và chọn bác sĩ phù hợp với chuyên khoa</p>
                </div>

                {doctors.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">Không có bác sĩ khả dụng</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                    {doctors.map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, doctorId: doctor.id, date: '', time: '' }))
                          setSelectedSlot(null)
                          setCurrentStep('schedule')
                        }}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          formData.doctorId === doctor.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg text-primary">
                            {getDoctorName(doctor).split(' ').pop()?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-lg">{getDoctorName(doctor)}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getDoctorSpecialty(doctor.specialty)} • {getDoctorExperienceYears(doctor)} năm kinh nghiệm
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm">{doctor.rating || '0.0'}</span>
                                <span className="text-xs text-muted-foreground">({doctor.reviewCount || 0} đánh giá)</span>
                              </div>
                            </div>
                          </div>
                          {(doctor.consultationFee || doctor.price) && (
                            <div className="text-right flex flex-col justify-center">
                              <p className="text-primary font-bold">{formatCurrency(Number(doctor.consultationFee ?? doctor.price ?? 0))}</p>
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

            {currentStep === 'schedule' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Chọn ngày & giờ khám</h2>
                  <p className="text-muted-foreground">Chọn ngày và khung giờ phù hợp</p>
                </div>

                {!isServiceBooking && !selectedDoctor ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <p className="text-muted-foreground">Vui lòng chọn bác sĩ trước</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isServiceBooking && selectedMedicalService && (
                      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
                        <p className="text-sm text-muted-foreground">Gói dịch vụ đã chọn</p>
                        <p className="font-semibold text-foreground">{selectedMedicalService.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedMedicalService.specialty?.name || 'Chuyên khoa'}</p>
                      </div>
                    )}

                    {selectedDoctor ? (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Bác sĩ đảm nhận</p>
                        <p className="font-semibold text-foreground">{getDoctorName(selectedDoctor)}</p>
                      </div>
                    ) : isServiceBooking ? (
                      <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                        Dịch vụ này chưa gán bác sĩ cố định. Hệ thống sẽ tự phân bác sĩ còn lịch trống khi bạn xác nhận đặt lịch.
                      </div>
                    ) : null}

                    <div>
                      <Label htmlFor="appointment-date" className="text-base font-semibold mb-2 block">
                        Ngày khám
                      </Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button id="appointment-date" type="button" variant="outline" className="h-12 w-full justify-between px-4 text-base font-normal">
                            {formData.date ? <span>{formatDateDisplay(formData.date)}</span> : <span className="text-muted-foreground">Chọn ngày khám</span>}
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateString(formData.date) ?? undefined}
                            onSelect={(date) => {
                              if (!date) return
                              if (isDateOutOfRange(date)) {
                                toast({
                                  title: 'Ngày khám chưa hợp lệ',
                                  description:
                                    bookingDateRangeLabel ||
                                    'Vui lòng chọn ngày trong phạm vi hệ thống cho phép.',
                                  variant: 'destructive',
                                })
                                return
                              }
                              setFormData((prev) => ({ ...prev, date: formatDateAsIso(date), time: '' }))
                              setSelectedSlot(null)
                              setSlotsError(null)
                              setIsDatePickerOpen(false)
                            }}
                            disabled={(date) => isDateOutOfRange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {bookingDateRangeLabel ? (
                        <p className="mt-2 text-xs text-muted-foreground">{bookingDateRangeLabel}</p>
                      ) : null}
                    </div>

                    {formData.date && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Khung giờ khám</Label>
                        {slotsLoading ? (
                          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{sortedSlots.map((slot) => renderSlotButton(slot))}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'patient' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Thông tin bệnh nhân</h2>
                  <p className="text-muted-foreground">Kiểm tra và cập nhật hồ sơ trước khi xác nhận đặt lịch.</p>
                </div>

                {submitError ? (
                  <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-destructive font-medium">{submitError}</p>
                  </div>
                ) : null}

                {patientProfileLoading ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Đang tải hồ sơ bệnh nhân...</p>
                  </div>
                ) : patientProfileError ? (
                  <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
                    <p className="text-destructive font-medium">{patientProfileError}</p>
                    <Button type="button" variant="outline" onClick={() => void loadCurrentPatient()}>
                      Tải lại hồ sơ
                    </Button>
                  </div>
                ) : needsProfileCompletion && patient ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                      Hồ sơ của bạn chưa hoàn tất. Vui lòng cập nhật đầy đủ các trường bắt buộc để tiếp tục đặt lịch.
                    </div>
                    <PatientProfileForm
                      patient={patient}
                      onSuccess={(updatedPatient) => {
                        setPatient(updatedPatient)
                        syncPatientIntoBookingForm(updatedPatient)
                        setSubmitError(null)
                      }}
                    />
                  </div>
                ) : needsProfileCompletion ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    Không thể lấy dữ liệu hồ sơ. Vui lòng tải lại bước này để tiếp tục.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="patient-name" className="text-base font-semibold mb-2 block">
                        Họ và tên <span className="text-destructive">*</span>
                      </Label>
                      <Input id="patient-name" placeholder="Nhập họ và tên" value={formData.patientName} onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))} className="text-base p-3 h-12" />
                    </div>
                    <div>
                      <Label htmlFor="patient-phone" className="text-base font-semibold mb-2 block">
                        Số điện thoại <span className="text-destructive">*</span>
                      </Label>
                      <Input id="patient-phone" placeholder="Nhập số điện thoại" value={formData.patientPhone} onChange={(e) => setFormData((prev) => ({ ...prev, patientPhone: e.target.value }))} className="text-base p-3 h-12" />
                    </div>
                    <div>
                      <Label htmlFor="patient-email" className="text-base font-semibold mb-2 block">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input id="patient-email" type="email" placeholder="Nhập email" value={formData.patientEmail} onChange={(e) => setFormData((prev) => ({ ...prev, patientEmail: e.target.value }))} className="text-base p-3 h-12" />
                    </div>
                    <div>
                      <Label htmlFor="symptoms" className="text-base font-semibold mb-2 block">
                        Triệu chứng / Ghi chú <span className="text-muted-foreground">(không bắt buộc)</span>
                      </Label>
                      <Textarea id="symptoms" placeholder="Mô tả triệu chứng hoặc lý do khám..." value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} rows={5} className="text-base p-3" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'confirm' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Xác nhận thông tin đặt lịch</h2>
                  <p className="text-muted-foreground">Vui lòng kiểm tra lại thông tin trước khi xác nhận</p>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Thông tin khám</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Dịch vụ</span>
                          <span className="font-medium text-right">{selectedMedicalService?.name || 'Khám bệnh'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Chuyên khoa</span>
                          <span className="font-medium text-right">
                            {selectedMedicalService?.specialty?.name || (selectedDoctor ? getDoctorSpecialty(selectedDoctor?.specialty) : '—')}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Bác sĩ</span>
                          <span className="font-medium text-right">
                            {selectedDoctor ? getDoctorName(selectedDoctor) : isServiceBooking ? 'Hệ thống sẽ tự phân bác sĩ' : '—'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-4">Ngày giờ khám</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Ngày</span>
                          <span className="font-medium text-right">{formData.date ? formatDateDisplay(formData.date) : '—'}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Giờ</span>
                          <span className="font-medium text-right">
                            {selectedSlot?.startTime ? formatTimeDisplay(selectedSlot.startTime) : formData.time ? formatTimeDisplay(formData.time) : '—'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                            <p className="text-sm font-medium bg-muted/50 p-3 rounded text-foreground">{formData.notes}</p>
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

            <div className="flex justify-between gap-4 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <Button
                onClick={async () => {
                  if (currentStepIndex < activeSteps.length - 1) {
                    goToNextStep()
                  } else {
                    await submitBooking()
                  }
                }}
                disabled={!canProceed() || submitLoading}
                size="lg"
                className="gap-2"
              >
                {currentStepIndex === activeSteps.length - 1 ? (
                  submitLoading ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Xác nhận và thanh toán
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

      <div className="lg:col-span-1">
        <Card className="sticky top-24 border-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg text-foreground mb-6">Tóm tắt đặt lịch</h3>
            <div className="space-y-5 text-sm">
              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dịch vụ</p>
                <p className="font-semibold text-foreground">{selectedMedicalService?.name || 'Khám bệnh'}</p>
              </div>

              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bác sĩ</p>
                {selectedDoctor ? (
                  <div>
                    <p className="font-semibold text-foreground">{getDoctorName(selectedDoctor)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getDoctorSpecialty(selectedDoctor?.specialty)}</p>
                  </div>
                ) : isServiceBooking ? (
                  <p className="text-muted-foreground">Hệ thống tự phân bác sĩ</p>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn</p>
                )}
              </div>

              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ngày</p>
                {formData.date ? <p className="font-semibold text-foreground">{formatDateDisplay(formData.date)}</p> : <p className="text-muted-foreground italic">Chưa chọn</p>}
              </div>

              <div className="pb-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Giờ</p>
                {selectedSlot?.startTime || formData.time ? (
                  <p className="font-semibold text-foreground">{formatTimeDisplay(selectedSlot?.startTime ?? formData.time)}</p>
                ) : (
                  <p className="text-muted-foreground italic">Chưa chọn</p>
                )}
              </div>

              {isServiceBooking && selectedMedicalService?.price ? (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Giá dịch vụ</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(Number(selectedMedicalService.price || 0))}</p>
                </div>
              ) : selectedDoctor?.consultationFee || selectedDoctor?.price ? (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tổng phí</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(Number(selectedDoctor?.consultationFee ?? selectedDoctor?.price ?? 0))}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



