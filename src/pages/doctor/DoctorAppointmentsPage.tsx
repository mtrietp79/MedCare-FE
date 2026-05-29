import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronsUpDown, Eye, FilePenLine, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import {
  doctorAppointmentService,
  type CompleteAppointmentPayload,
  type CompleteAppointmentResponse,
  type DoctorAppointment,
  type DoctorMedicalService,
  type DoctorMedicine,
} from '@/services/doctorAppointmentService'
import { api, type AppointmentSlot } from '@/services/api'
import { doctorMedicalRecordService } from '@/services/doctorMedicalRecordService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeString } from '@/lib/admin-normalizers'
import { useToast } from '@/hooks/use-toast'
import { QUERY_KEYS, invalidateQueries } from '@/lib/query-invalidation'
import { cn } from '@/lib/utils'

interface PrescriptionItemForm {
  medicineCategory: string
  medicineId: string
  quantity: string
  dosage: string
  note: string
}

interface SelectedServiceForm {
  serviceId: string
  note: string
}

interface CompleteFormState {
  symptoms: string
  diagnosis: string
  advice: string
  medicines: PrescriptionItemForm[]
  medicalServices: SelectedServiceForm[]
  followUpEnabled: boolean
  followUpDate: string
  followUpTime: string
  followUpNote: string
}

interface FollowUpValidationErrors {
  date?: string
  time?: string
}

interface FollowUpSlotView {
  value: string
  label: string
  disabled: boolean
  disabledReason?: string
}

interface CompleteResultSummary {
  invoiceTitle?: string
  invoiceFormula?: string
  followUpText?: string
}

const SLOT_DISABLED_REASONS = new Set(['PAST', 'LESS_THAN_2H', 'FULL', 'TOO_FAR'])
const MEDICINE_CATEGORY_ALL = '__all__'

const initialCompleteForm: CompleteFormState = {
  symptoms: '',
  diagnosis: '',
  advice: '',
  medicines: [{ medicineCategory: MEDICINE_CATEGORY_ALL, medicineId: '', quantity: '1', dosage: '', note: '' }],
  medicalServices: [],
  followUpEnabled: false,
  followUpDate: '',
  followUpTime: '',
  followUpNote: '',
}

function parseDateInput(value?: string): Date | null {
  const source = safeString(value)
  if (!source) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    const [year, month, day] = source.split('-').map(Number)
    const date = new Date(year, month - 1, day, 0, 0, 0, 0)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toDateOnly(value: Date): Date {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatDateAsIso(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(value?: string): string {
  const parsed = parseDateInput(value)
  return parsed ? parsed.toLocaleDateString('vi-VN') : ''
}

function extractTimeLabelFromDateTime(value?: string): string {
  const source = safeString(value)
  if (!source) return ''

  const parsed = new Date(source)
  if (!Number.isNaN(parsed.getTime())) {
    const hours = String(parsed.getHours()).padStart(2, '0')
    const minutes = String(parsed.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const match = source.match(/(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${String(Number(match[1])).padStart(2, '0')}:${String(Number(match[2])).padStart(2, '0')}`
}

function formatDateDdMmYyyy(value?: string): string {
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

function normalizeText(value: string): string {
  return safeString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeStatus(rawStatus: string): 'pending' | 'completed' | 'cancelled' {
  const status = normalizeText(rawStatus)
  if (status.includes('huy') || status.includes('cancel')) return 'cancelled'
  if (status.includes('completed') || status.includes('da kham') || status.includes('hoan thanh')) return 'completed'
  return 'pending'
}

function getStatusLabel(rawStatus: string): string {
  const key = normalizeStatus(rawStatus)
  if (key === 'pending') return 'Chá» khÃ¡m'
  if (key === 'completed') return 'ÄÃ£ khÃ¡m'
  return 'Há»§y lá»‹ch'
}

function getStatusBadgeClass(rawStatus: string): string {
  const key = normalizeStatus(rawStatus)
  if (key === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (key === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

function getAppointmentTypeLabel(rawType: string): string {
  const type = normalizeText(rawType)
  if (type.includes('tai') || type.includes('follow') || type.includes('revisit')) return 'TÃ¡i khÃ¡m'
  return 'KhÃ¡m bá»‡nh'
}

function getPatientName(appointment: DoctorAppointment): string {
  return safeString(appointment.patientName) || safeString(appointment.patient?.fullName) || '-'
}

function isServicePackageBooking(appointment: DoctorAppointment): boolean {
  const typeText = normalizeText(
    safeString((appointment as any).appointmentType) || safeString((appointment as any).type)
  )
  const serviceText = normalizeText(
    safeString((appointment as any).medicalService?.name) ||
      safeString((appointment as any).servicePackage?.name)
  )
  return (
    typeText.includes('service_package') ||
    typeText.includes('goi dich vu') ||
    typeText.includes('service package') ||
    serviceText.includes('goi dich vu') ||
    serviceText.includes('service package')
  )
}

function getDateLabel(appointment: DoctorAppointment): string {
  return formatDateDdMmYyyy(safeString(appointment.appointmentDate) || safeString(appointment.date))
}

function getTimeLabel(appointment: DoctorAppointment): string {
  return (
    safeString(appointment.appointmentTime) ||
    safeString(appointment.time) ||
    safeString(appointment.appointmentTimeLabel) ||
    '--:--'
  )
}

function formatCurrencyVnd(value?: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

function getMedicineUnitLabel(rawUnit?: string): string {
  return safeString(rawUnit) || 'Đơn vị khác'
}

function getMedicineCategoryLabel(rawCategory?: string): string {
  return safeString(rawCategory) || 'Khác'
}

function isMedicineOutOfStock(medicine?: DoctorMedicine): boolean {
  if (!medicine) return true

  const stock = Number(medicine.quantity ?? 0)
  if (Number.isFinite(stock) && stock <= 0) return true

  const status = normalizeText(safeString(medicine.status))
  return status.includes('het hang') || status.includes('out_of_stock')
}

function getPaymentStatusView(rawPaymentStatus?: string): { label: string; className: string } {
  const source = safeString(rawPaymentStatus)
  if (!source) {
    return {
      label: '-',
      className: 'bg-slate-50 text-slate-700 border-slate-200',
    }
  }

  const normalized = normalizeText(source)
  if (normalized.includes('paid')) {
    return {
      label: 'ÄÃ£ thanh toÃ¡n',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }

  if (normalized.includes('fail')) {
    return {
      label: 'Thanh toÃ¡n tháº¥t báº¡i',
      className: 'bg-red-50 text-red-700 border-red-200',
    }
  }

  if (normalized.includes('cancel')) {
    return {
      label: 'ÄÃ£ há»§y thanh toÃ¡n',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
    }
  }

  if (normalized.includes('unpaid') || normalized.includes('pending')) {
    return {
      label: 'ChÆ°a thanh toÃ¡n',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  return {
    label: source,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  }
}

function mergeDefinedAppointmentFields(
  base: DoctorAppointment,
  patch: Partial<DoctorAppointment>
): DoctorAppointment {
  const definedEntries = Object.entries(patch).filter(([, value]) => value !== undefined && value !== null)
  return {
    ...base,
    ...Object.fromEntries(definedEntries),
  } as DoctorAppointment
}

function getBackendErrorMessage(error: any, fallbackMessage: string): string {
  const backendMessage = safeString(error?.response?.data?.message)
  if (backendMessage) return backendMessage

  const directMessage = safeString(error?.message)
  if (directMessage) return directMessage

  return fallbackMessage
}

function isFollowUpAppointment(appointment: DoctorAppointment): boolean {
  const typeSource = normalizeText(
    safeString(appointment.appointmentType) || safeString(appointment.type)
  )
  return (
    Boolean(appointment.parentAppointmentId) ||
    typeSource.includes('tai') ||
    typeSource.includes('follow') ||
    typeSource.includes('revisit')
  )
}

export function DoctorAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [medicines, setMedicines] = useState<DoctorMedicine[]>([])
  const [medicineCategories, setMedicineCategories] = useState<string[]>([])
  const [medicinePickerKeyword, setMedicinePickerKeyword] = useState('')
  const [medicinePickerOptions, setMedicinePickerOptions] = useState<DoctorMedicine[]>([])
  const [medicinePickerLoading, setMedicinePickerLoading] = useState(false)
  const [medicinePickerError, setMedicinePickerError] = useState('')
  const [medicalServices, setMedicalServices] = useState<DoctorMedicalService[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [formState, setFormState] = useState<CompleteFormState>(initialCompleteForm)
  const [initialSymptoms, setInitialSymptoms] = useState('')
  const [diagnosisError, setDiagnosisError] = useState('')
  const [followUpErrors, setFollowUpErrors] = useState<FollowUpValidationErrors>({})
  const [followUpSlots, setFollowUpSlots] = useState<AppointmentSlot[]>([])
  const [followUpSlotsLoading, setFollowUpSlotsLoading] = useState(false)
  const [followUpSlotsError, setFollowUpSlotsError] = useState('')
  const [isFollowUpDatePickerOpen, setIsFollowUpDatePickerOpen] = useState(false)
  const [openMedicinePickerIndex, setOpenMedicinePickerIndex] = useState<number | null>(null)
  const [serviceDraftId, setServiceDraftId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [completeResultSummary, setCompleteResultSummary] = useState<CompleteResultSummary | null>(null)
  const debouncedMedicinePickerKeyword = useDebouncedValue(medicinePickerKeyword, 300)

  const refreshAppointmentsList = async () => {
    const appointmentsResult = await doctorAppointmentService.getAppointments()
    const normalizedAppointments = Array.isArray(appointmentsResult) ? appointmentsResult : []
    const nextAppointments = normalizedAppointments.filter((item) => !isServicePackageBooking(item))
    setAppointments(nextAppointments)
    return nextAppointments
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      await refreshAppointmentsList()

      const [medicinesResult, servicesResult, medicineCategoriesResult] = await Promise.allSettled([
        doctorAppointmentService.getMedicines(),
        doctorAppointmentService.getMedicalServices(),
        doctorAppointmentService.getMedicineCategories(),
      ])

      setMedicines(
        medicinesResult.status === 'fulfilled' && Array.isArray(medicinesResult.value)
          ? medicinesResult.value
          : []
      )

      setMedicalServices(
        servicesResult.status === 'fulfilled' && Array.isArray(servicesResult.value)
          ? servicesResult.value
          : []
      )

      setMedicineCategories(
        medicineCategoriesResult.status === 'fulfilled' && Array.isArray(medicineCategoriesResult.value)
          ? medicineCategoriesResult.value.map((item) => safeString(item)).filter(Boolean)
          : []
      )
    } catch (fetchError: any) {
      setError(fetchError?.message || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch lá»‹ch háº¹n.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const selectedAppointmentTypeLabel = useMemo(
    () =>
      selectedAppointment
        ? getAppointmentTypeLabel(
            safeString(selectedAppointment.appointmentType) || safeString(selectedAppointment.type)
          )
        : 'KhÃ¡m bá»‡nh',
    [selectedAppointment]
  )

  const isCurrentAppointmentFollowUp = useMemo(
    () => selectedAppointmentTypeLabel === 'TÃ¡i khÃ¡m',
    [selectedAppointmentTypeLabel]
  )

  const medicinePriceById = useMemo(() => {
    const nextMap = new Map<string, number>()
    medicines.forEach((medicine) => {
      nextMap.set(String(medicine.id), Number(medicine.price ?? 0))
    })
    return nextMap
  }, [medicines])

  const medicineById = useMemo(() => {
    const nextMap = new Map<string, DoctorMedicine>()
    medicines.forEach((medicine) => {
      nextMap.set(String(medicine.id), medicine)
    })
    return nextMap
  }, [medicines])

  const medicineCategoryOptions = useMemo(() => {
    const uniqueCategories = new Map<string, string>()
    uniqueCategories.set(MEDICINE_CATEGORY_ALL, 'Tất cả')

    medicineCategories.forEach((category) => {
      const normalizedCategory = getMedicineCategoryLabel(category)
      if (!uniqueCategories.has(normalizedCategory)) {
        uniqueCategories.set(normalizedCategory, normalizedCategory)
      }
    })

    if (uniqueCategories.size === 1) {
      medicines.forEach((medicine) => {
        const fallbackCategory = getMedicineCategoryLabel(medicine.medicineCategory)
        if (!uniqueCategories.has(fallbackCategory)) {
          uniqueCategories.set(fallbackCategory, fallbackCategory)
        }
      })
    }

    return Array.from(uniqueCategories.entries()).map(([value, label]) => ({ value, label }))
  }, [medicineCategories, medicines])

  const activeMedicinePickerCategory = useMemo(() => {
    if (openMedicinePickerIndex === null) return MEDICINE_CATEGORY_ALL
    return safeString(formState.medicines[openMedicinePickerIndex]?.medicineCategory) || MEDICINE_CATEGORY_ALL
  }, [formState.medicines, openMedicinePickerIndex])

  const servicePriceById = useMemo(() => {
    const nextMap = new Map<string, number>()
    medicalServices.forEach((service) => {
      nextMap.set(String(service.id), Number(service.price ?? 0))
    })
    return nextMap
  }, [medicalServices])

  const selectedServiceDetails = useMemo(
    () =>
      formState.medicalServices
        .map((item) => {
          const service = medicalServices.find((entry) => String(entry.id) === String(item.serviceId))
          if (!service) return null
          return {
            ...item,
            name: service.name,
            price: Number(service.price ?? 0),
          }
        })
        .filter((item): item is SelectedServiceForm & { name: string; price: number } => item !== null),
    [formState.medicalServices, medicalServices]
  )

  const availableServiceOptions = useMemo(
    () =>
      medicalServices.filter(
        (service) =>
          !formState.medicalServices.some((selectedService) => String(selectedService.serviceId) === String(service.id))
      ),
    [formState.medicalServices, medicalServices]
  )

  const medicinePreviewTotal = useMemo(
    () =>
      formState.medicines.reduce((sum, item) => {
        const quantity = Number(item.quantity)
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
        const unitPrice = Number(medicinePriceById.get(item.medicineId) ?? 0)
        return sum + safeQuantity * unitPrice
      }, 0),
    [formState.medicines, medicinePriceById]
  )

  const servicePreviewTotal = useMemo(
    () =>
      formState.medicalServices.reduce((sum, item) => {
        const unitPrice = Number(servicePriceById.get(item.serviceId) ?? 0)
        return sum + unitPrice
      }, 0),
    [formState.medicalServices, servicePriceById]
  )

  const consultationFeePreview = Number(selectedAppointment?.consultationFee ?? 0)
  const consultationFeeAppliedPreview = isCurrentAppointmentFollowUp ? consultationFeePreview : 0
  const estimatedTotal = consultationFeeAppliedPreview + medicinePreviewTotal + servicePreviewTotal

  const filteredAppointments = useMemo(() => {
    const keywordLower = normalizeText(keyword)
    if (!keywordLower) return appointments

    return appointments.filter((appointment) => {
      const patient = normalizeText(getPatientName(appointment))
      const date = normalizeText(getDateLabel(appointment))
      const type = normalizeText(
        getAppointmentTypeLabel(safeString(appointment.appointmentType) || safeString(appointment.type))
      )
      const status = normalizeText(getStatusLabel(safeString(appointment.status)))
      return [patient, date, type, status].some((value) => value.includes(keywordLower))
    })
  }, [appointments, keyword])

  const followUpSlotViews = useMemo<FollowUpSlotView[]>(() => {
    const sorted = [...followUpSlots].sort(
      (slotA, slotB) => new Date(slotA.startTime).getTime() - new Date(slotB.startTime).getTime()
    )

    const mapped: FollowUpSlotView[] = []
    sorted.forEach((slot) => {
      const value = extractTimeLabelFromDateTime(slot.startTime)
      if (!value) return

      const disabledReason = String(slot.disabledReason || '').trim().toUpperCase()
      const disabled = Boolean(slot.disabled) || Boolean(slot.full) || SLOT_DISABLED_REASONS.has(disabledReason)
      mapped.push({
        value,
        label: value,
        disabled,
        disabledReason,
      })
    })

    const uniqueByValue = new Map<string, FollowUpSlotView>()
    mapped.forEach((slot) => {
      if (!uniqueByValue.has(slot.value)) {
        uniqueByValue.set(slot.value, slot)
      }
    })

    return Array.from(uniqueByValue.values())
  }, [followUpSlots])

  useEffect(() => {
    if (!formState.followUpEnabled || !formState.followUpDate || !selectedAppointment?.doctorId) {
      setFollowUpSlots([])
      setFollowUpSlotsError('')
      setFollowUpSlotsLoading(false)
      return
    }

    let active = true

    const loadFollowUpSlots = async () => {
      try {
        setFollowUpSlotsLoading(true)
        setFollowUpSlotsError('')
        const slotsResult = await api.appointments.getDoctorSlots(selectedAppointment.doctorId || '', formState.followUpDate)
        if (!active) return
        setFollowUpSlots(Array.isArray(slotsResult) ? slotsResult : [])
      } catch (slotError: any) {
        if (!active) return
        setFollowUpSlots([])
        setFollowUpSlotsError(
          getBackendErrorMessage(slotError, 'KhÃ´ng thá»ƒ táº£i khung giá» tÃ¡i khÃ¡m. Vui lÃ²ng nháº­p giá» thá»§ cÃ´ng.')
        )
      } finally {
        if (active) {
          setFollowUpSlotsLoading(false)
        }
      }
    }

    void loadFollowUpSlots()

    return () => {
      active = false
    }
  }, [formState.followUpDate, formState.followUpEnabled, selectedAppointment?.doctorId])

  useEffect(() => {
    if (!completeOpen || openMedicinePickerIndex === null) {
      setMedicinePickerOptions([])
      setMedicinePickerLoading(false)
      setMedicinePickerError('')
      return
    }

    let active = true

    const fetchMedicines = async () => {
      try {
        setMedicinePickerLoading(true)
        setMedicinePickerError('')

        const queryCategory =
          activeMedicinePickerCategory === MEDICINE_CATEGORY_ALL ? undefined : activeMedicinePickerCategory
        const keywordValue = safeString(debouncedMedicinePickerKeyword)

        const result = await doctorAppointmentService.getMedicines({
          keyword: keywordValue || undefined,
          category: queryCategory || undefined,
        })

        if (!active) return
        setMedicinePickerOptions(Array.isArray(result) ? result : [])

        setMedicines((prev) => {
          if (!Array.isArray(result) || result.length === 0) return prev
          const byId = new Map<string, DoctorMedicine>()
          prev.forEach((item) => byId.set(String(item.id), item))
          result.forEach((item) => byId.set(String(item.id), item))
          return Array.from(byId.values())
        })
      } catch (fetchError: any) {
        if (!active) return
        setMedicinePickerOptions([])
        setMedicinePickerError(getBackendErrorMessage(fetchError, 'Không thể tải danh sách thuốc.'))
      } finally {
        if (active) {
          setMedicinePickerLoading(false)
        }
      }
    }

    void fetchMedicines()

    return () => {
      active = false
    }
  }, [activeMedicinePickerCategory, completeOpen, debouncedMedicinePickerKeyword, openMedicinePickerIndex])

  const openDetail = async (appointment: DoctorAppointment) => {
    try {
      const detail = await doctorAppointmentService.getAppointmentById(String(appointment.id))
      setSelectedAppointment(mergeDefinedAppointmentFields(appointment, detail ?? {}))
    } catch {
      setSelectedAppointment(appointment)
    }
    setDetailOpen(true)
  }

  const openComplete = async (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment)
    setFollowUpErrors({})
    setFollowUpSlots([])
    setFollowUpSlotsError('')
    setIsFollowUpDatePickerOpen(false)
    setOpenMedicinePickerIndex(null)
    setMedicinePickerKeyword('')
    setMedicinePickerOptions([])
    setMedicinePickerError('')
    setMedicinePickerLoading(false)
    setServiceDraftId('')
    setSubmitError('')
    setDiagnosisError('')
    const fallbackSymptoms = safeString(appointment.symptoms)
    setInitialSymptoms(fallbackSymptoms)
    setFormState({
      ...initialCompleteForm,
      symptoms: fallbackSymptoms,
    })

    try {
      const detail = await doctorAppointmentService.getAppointmentById(String(appointment.id))
      const resolvedAppointment = mergeDefinedAppointmentFields(appointment, detail ?? {})
      const resolvedSymptoms = safeString(resolvedAppointment.symptoms)
      setSelectedAppointment(resolvedAppointment)
      setInitialSymptoms(resolvedSymptoms)
      setFormState((prev) => ({
        ...prev,
        symptoms: resolvedSymptoms,
      }))
    } catch {
      // Keep fallback row data when detail API fails.
    }

    setCompleteOpen(true)
  }

  const handleAddMedicineRow = () => {
    const hasPendingRow = formState.medicines.some((item) => !safeString(item.medicineId))
    if (hasPendingRow) {
      toast({
        title: 'Chưa chọn thuốc',
        description: 'Vui lòng chọn thuốc ở dòng hiện tại trước khi thêm dòng mới.',
        variant: 'destructive',
      })
      return
    }

    setFormState((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { medicineCategory: MEDICINE_CATEGORY_ALL, medicineId: '', quantity: '1', dosage: '', note: '' },
      ],
    }))
  }

  const handleRemoveMedicineRow = (index: number) => {
    setOpenMedicinePickerIndex((prev) => {
      if (prev === null) return prev
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
    if (openMedicinePickerIndex === index) {
      setMedicinePickerKeyword('')
      setMedicinePickerOptions([])
      setMedicinePickerError('')
    }
    setFormState((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleMedicineChange = (index: number, field: keyof PrescriptionItemForm, value: string) => {
    setFormState((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleMedicineCategoryChange = (index: number, nextCategory: string) => {
    if (openMedicinePickerIndex === index) {
      setMedicinePickerKeyword('')
    }

    setFormState((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        const currentMedicine = medicines.find((medicine) => String(medicine.id) === String(item.medicineId))
        const currentCategory = getMedicineCategoryLabel(currentMedicine?.medicineCategory)
        const stillValid =
          nextCategory === MEDICINE_CATEGORY_ALL || (item.medicineId && currentCategory === nextCategory)

        return {
          ...item,
          medicineCategory: nextCategory,
          medicineId: stillValid ? item.medicineId : '',
        }
      }),
    }))
  }

  const handleAddService = () => {
    const nextServiceId = safeString(serviceDraftId)
    if (!nextServiceId) return

    setFormState((prev) => {
      const exists = prev.medicalServices.some((service) => String(service.serviceId) === nextServiceId)
      if (exists) return prev
      return {
        ...prev,
        medicalServices: [...prev.medicalServices, { serviceId: nextServiceId, note: '' }],
      }
    })
    setServiceDraftId('')
  }

  const handleRemoveService = (serviceId: string) => {
    setFormState((prev) => ({
      ...prev,
      medicalServices: prev.medicalServices.filter((service) => String(service.serviceId) !== String(serviceId)),
    }))
  }

  const handleServiceNoteChange = (serviceId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      medicalServices: prev.medicalServices.map((service) =>
        service.serviceId === serviceId ? { ...service, note } : service
      ),
    }))
  }

  const validateFollowUpForm = (): boolean => {
    if (!formState.followUpEnabled) {
      setFollowUpErrors({})
      return true
    }

    const nextErrors: FollowUpValidationErrors = {}

    if (!formState.followUpDate) {
      nextErrors.date = 'Vui lÃ²ng chá»n ngÃ y tÃ¡i khÃ¡m.'
    } else {
      const now = new Date()
      const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      if (formState.followUpDate < localToday) {
        nextErrors.date = 'NgÃ y tÃ¡i khÃ¡m khÃ´ng Ä‘Æ°á»£c á»Ÿ quÃ¡ khá»©.'
      }
    }

    if (!formState.followUpTime) {
      nextErrors.time = 'Vui lÃ²ng chá»n giá» tÃ¡i khÃ¡m.'
    }

    if (!nextErrors.date && !nextErrors.time && formState.followUpDate && formState.followUpTime) {
      const followUpDateTime = new Date(`${formState.followUpDate}T${formState.followUpTime}:00`)
      if (Number.isNaN(followUpDateTime.getTime()) || followUpDateTime.getTime() <= Date.now()) {
        nextErrors.time = 'Gio tai kham phai lon hon thoi diem hien tai.'
      }
    }

    setFollowUpErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const applyCompleteResultLocally = (
    sourceList: DoctorAppointment[],
    completedAppointmentId: string,
    result: CompleteAppointmentResponse,
    updatedSymptoms?: string
  ) => {
    const nextList = sourceList.map((appointment) => {
      if (String(appointment.id) !== completedAppointmentId) return appointment

      return {
        ...appointment,
        status: result.status || 'COMPLETED',
        type: result.appointmentType || appointment.appointmentType || appointment.type,
        appointmentType: result.appointmentType || appointment.appointmentType || appointment.type,
        consultationFee:
          result.invoice?.consultationFee ??
          result.followUpAppointment?.consultationFee ??
          appointment.consultationFee,
        symptoms: updatedSymptoms !== undefined ? updatedSymptoms : appointment.symptoms,
      }
    })

    const followUp = result.followUpAppointment
    if (followUp?.id) {
      const followUpId = String(followUp.id)
      const exists = nextList.some((appointment) => String(appointment.id) === followUpId)
      if (!exists) {
        nextList.push({
          id: followUpId,
          appointmentDate: followUp.appointmentDate,
          appointmentTime: followUp.appointmentTime,
          appointmentTimeLabel: followUp.appointmentTime,
          time: followUp.appointmentTime,
          type: followUp.appointmentType || followUp.type || 'TÃ¡i khÃ¡m',
          appointmentType: followUp.appointmentType || followUp.type || 'TÃ¡i khÃ¡m',
          status: followUp.status || 'PENDING',
          consultationFee: followUp.consultationFee,
          paymentStatus: followUp.paymentStatus,
          followUpNote: followUp.note,
          parentAppointmentId: followUp.parentAppointmentId
            ? String(followUp.parentAppointmentId)
            : completedAppointmentId,
          doctorId: selectedAppointment?.doctorId,
          doctor: selectedAppointment?.doctor,
          patientName: selectedAppointment ? getPatientName(selectedAppointment) : undefined,
          patient: selectedAppointment?.patient,
        })
      }
    }

    return nextList
  }

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment?.id || submitting) return

    const diagnosisValue = formState.diagnosis.trim()
    if (!diagnosisValue) {
      setDiagnosisError('Vui lÃ²ng nháº­p cháº©n Ä‘oÃ¡n trÆ°á»›c khi xÃ¡c nháº­n.')
      return
    }
    setDiagnosisError('')

    if (!validateFollowUpForm()) return

    const appointmentId = String(selectedAppointment.id)
    setSubmitError('')
    const normalizedInitialSymptoms = initialSymptoms.trim()
    const normalizedCurrentSymptoms = formState.symptoms.trim()
    const shouldSendSymptoms =
      normalizedCurrentSymptoms.length > 0 &&
      normalizedCurrentSymptoms !== normalizedInitialSymptoms

    const invalidMedicineIndex = formState.medicines.findIndex(
      (item) => safeString(item.medicineId) && Number(item.quantity) <= 0
    )
    if (invalidMedicineIndex >= 0) {
      setSubmitError(`Số lượng thuốc ở dòng ${invalidMedicineIndex + 1} phải lớn hơn 0.`)
      return
    }

    const payload: CompleteAppointmentPayload = {
      diagnosis: diagnosisValue,
      doctorAdvice: formState.advice.trim(),
      medicineItems: formState.medicines
        .filter((item) => item.medicineId && Number(item.quantity) > 0)
        .map((item) => ({
          medicineId: item.medicineId,
          quantity: Number(item.quantity),
          dosage: item.dosage.trim(),
          note: item.note.trim() || undefined,
        })),
      serviceItems: formState.medicalServices.map((service) => ({
        medicalServiceId: service.serviceId,
        note: service.note.trim() || undefined,
      })),
      followUp: {
        needFollowUp: formState.followUpEnabled,
        followUpDate: formState.followUpEnabled ? formState.followUpDate || undefined : undefined,
        followUpTime: formState.followUpEnabled ? formState.followUpTime || undefined : undefined,
        note: formState.followUpEnabled ? formState.followUpNote.trim() || undefined : undefined,
      },
    }
    if (shouldSendSymptoms) {
      payload.symptoms = normalizedCurrentSymptoms
    }

    setSubmitting(true)
    try {
      const completeResult = await doctorAppointmentService.completeAppointment(appointmentId, payload)
      setAppointments((prev) =>
        applyCompleteResultLocally(
          prev,
          appointmentId,
          completeResult,
          shouldSendSymptoms ? normalizedCurrentSymptoms : undefined
        )
      )
      setSelectedAppointment((prev) =>
        prev && String(prev.id) === appointmentId
          ? {
              ...prev,
              status: completeResult.status || 'COMPLETED',
              type: completeResult.appointmentType || prev.appointmentType || prev.type,
              appointmentType: completeResult.appointmentType || prev.appointmentType || prev.type,
              symptoms: shouldSendSymptoms ? normalizedCurrentSymptoms : prev.symptoms,
            }
          : prev
      )

      const syncResults = await Promise.allSettled([
        refreshAppointmentsList(),
        doctorMedicalRecordService.getSummary(),
        doctorMedicalRecordService.getPatients(''),
      ])

      invalidateQueries({
        keys: [
          QUERY_KEYS.doctorAppointmentList,
          QUERY_KEYS.doctorAppointmentDetail,
          QUERY_KEYS.doctorMedicalRecordSummary,
          QUERY_KEYS.doctorMedicalRecordPatients,
          QUERY_KEYS.patientMedicalRecordByAppointment,
        ],
        appointmentId,
      })

      const hasSyncFailed = syncResults.some((result) => result.status === 'rejected')
      if (hasSyncFailed) {
        const failedResult = syncResults.find((result) => result.status === 'rejected') as PromiseRejectedResult
        const syncErrorMessage = getBackendErrorMessage(
          failedResult?.reason,
          'HoÃ n táº¥t khÃ¡m thÃ nh cÃ´ng nhÆ°ng chÆ°a Ä‘á»“ng bá»™ Ä‘Æ°á»£c toÃ n bá»™ dá»¯ liá»‡u.'
        )
        toast({
          title: 'Cáº£nh bÃ¡o',
          description: syncErrorMessage,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'ThÃ nh cÃ´ng', description: 'ÄÃ£ hoÃ n táº¥t lá»‹ch khÃ¡m.' })
      }

      const consultationFee = Number(completeResult.invoice?.consultationFee ?? 0)
      const medicineTotal = Number(completeResult.invoice?.medicineTotal ?? 0)
      const serviceTotal = Number(completeResult.invoice?.serviceTotal ?? 0)
      const calculatedTotal = consultationFee + medicineTotal + serviceTotal
      const invoiceTotal = Number(completeResult.invoice?.totalAmount ?? calculatedTotal)

      const invoiceTitle = completeResult.invoice
        ? `HÃ³a Ä‘Æ¡n #${completeResult.invoice.id || '-'}`
        : undefined
      const invoiceFormula = completeResult.invoice
        ? `Tá»•ng tiá»n = PhÃ­ khÃ¡m + Tiá»n thuá»‘c + Tiá»n dá»‹ch vá»¥: ${formatCurrencyVnd(invoiceTotal)} = ${formatCurrencyVnd(
            consultationFee
          )} + ${formatCurrencyVnd(medicineTotal)} + ${formatCurrencyVnd(serviceTotal)}`
        : undefined
      const followUpText = completeResult.followUpAppointment?.id
        ? `ÄÃ£ táº¡o lá»‹ch tÃ¡i khÃ¡m #${completeResult.followUpAppointment.id}.`
        : undefined
      setCompleteResultSummary({ invoiceTitle, invoiceFormula, followUpText })

      setCompleteOpen(false)
      setFormState(initialCompleteForm)
      setInitialSymptoms('')
      setDiagnosisError('')
      setFollowUpErrors({})
      setSubmitError('')
    } catch (submitError: any) {
      const errorMessage = getBackendErrorMessage(submitError, 'Khong the hoan tat lich kham.')
      setSubmitError(errorMessage)
      toast({
        title: 'Lá»—i',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStatusLabel = selectedAppointment ? getStatusLabel(safeString(selectedAppointment.status)) : '-'
  const selectedStatusBadgeClass = getStatusBadgeClass(selectedStatusLabel)
  const selectedPaymentView = getPaymentStatusView(selectedAppointment?.paymentStatus)
  const todayDateOnly = toDateOnly(new Date())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Lá»‹ch háº¹n</h1>
        <p className="text-[#6b7280]">Quáº£n lÃ½ lá»‹ch khÃ¡m cá»§a bá»‡nh nhÃ¢n</p>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Danh sÃ¡ch lá»‹ch háº¹n</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="TÃ¬m theo bá»‡nh nhÃ¢n, ngÃ y khÃ¡m, tráº¡ng thÃ¡i..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="max-w-md"
          />

          {completeResultSummary && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {completeResultSummary.invoiceTitle && <div>{completeResultSummary.invoiceTitle}</div>}
              {completeResultSummary.invoiceFormula && <div>{completeResultSummary.invoiceFormula}</div>}
              {completeResultSummary.followUpText && <div>{completeResultSummary.followUpText}</div>}
            </div>
          )}

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadData()} />}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bá»‡nh nhÃ¢n</TableHead>
                  <TableHead>NgÃ y giá»</TableHead>
                  <TableHead>Loáº¡i khÃ¡m</TableHead>
                  <TableHead>Tráº¡ng thÃ¡i</TableHead>
                  <TableHead className="text-right">HÃ nh Ä‘á»™ng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const statusLabel = getStatusLabel(safeString(appointment.status))
                  const statusKey = normalizeStatus(safeString(appointment.status))
                  const appointmentType = getAppointmentTypeLabel(
                    safeString(appointment.appointmentType) || safeString(appointment.type)
                  )

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{getPatientName(appointment)}</TableCell>
                      <TableCell>
                        <div>{getDateLabel(appointment)}</div>
                        <div className="text-xs text-[#6b7280]">{getTimeLabel(appointment)}</div>
                      </TableCell>
                      <TableCell>
                        <div>{appointmentType}</div>
                        {isFollowUpAppointment(appointment) && appointment.parentAppointmentId && (
                          <div className="text-xs text-[#6b7280]">Lá»‹ch gá»‘c: #{appointment.parentAppointmentId}</div>
                        )}
                        {safeString(appointment.followUpNote) && (
                          <div className="text-xs text-[#6b7280]">Ghi chÃº: {safeString(appointment.followUpNote)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full border ${getStatusBadgeClass(statusLabel)}`}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {statusKey === 'cancelled' && (
                          <Badge className="rounded-full border bg-red-50 text-red-700 border-red-200">ÄÃ£ há»§y</Badge>
                        )}

                        {statusKey !== 'cancelled' && (
                          <div className="inline-flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => void openDetail(appointment)}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {statusKey === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => void openComplete(appointment)}>
                                <FilePenLine className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {filteredAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-[#6b7280]">
                      KhÃ´ng cÃ³ lá»‹ch háº¹n phÃ¹ há»£p.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Chi tiáº¿t lá»‹ch háº¹n</DialogTitle>
            <DialogDescription>ThÃ´ng tin cuá»™c háº¹n cá»§a bá»‡nh nhÃ¢n</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="grid gap-3 text-sm">
              <div><span className="font-semibold">Bá»‡nh nhÃ¢n:</span> {getPatientName(selectedAppointment)}</div>
              <div><span className="font-semibold">NgÃ y khÃ¡m:</span> {getDateLabel(selectedAppointment)}</div>
              <div><span className="font-semibold">Giá» khÃ¡m:</span> {getTimeLabel(selectedAppointment)}</div>
              <div>
                <span className="font-semibold">Loáº¡i khÃ¡m:</span>{' '}
                {getAppointmentTypeLabel(
                  safeString(selectedAppointment.appointmentType) || safeString(selectedAppointment.type)
                )}
              </div>
              <div><span className="font-semibold">Tráº¡ng thÃ¡i:</span> {getStatusLabel(safeString(selectedAppointment.status))}</div>
              <div>
                <span className="font-semibold">PhÃ­ khÃ¡m:</span>{' '}
                {selectedAppointment.consultationFee !== undefined
                  ? formatCurrencyVnd(selectedAppointment.consultationFee)
                  : '-'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Thanh toÃ¡n:</span>
                <Badge
                  className={`rounded-full border ${getPaymentStatusView(selectedAppointment.paymentStatus).className}`}
                >
                  {getPaymentStatusView(selectedAppointment.paymentStatus).label}
                </Badge>
              </div>
              {selectedAppointment.parentAppointmentId && (
                <div><span className="font-semibold">Lá»‹ch gá»‘c:</span> #{selectedAppointment.parentAppointmentId}</div>
              )}
              {safeString(selectedAppointment.followUpNote) && (
                <div><span className="font-semibold">Ghi chÃº tÃ¡i khÃ¡m:</span> {safeString(selectedAppointment.followUpNote)}</div>
              )}
              <div>
                <span className="font-semibold">Triá»‡u chá»©ng/ Ghi chÃº:</span>{' '}
                {(() => {
                  const symptomsText = safeString(selectedAppointment.symptoms)
                  const notesText = safeString(selectedAppointment.notes)
                  if (symptomsText && notesText) return `${symptomsText} | ${notesText}`
                  return symptomsText || notesText || '-'
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={completeOpen}
        onOpenChange={(nextOpen) => {
          setCompleteOpen(nextOpen)
          if (!nextOpen) {
            setServiceDraftId('')
            setIsFollowUpDatePickerOpen(false)
            setOpenMedicinePickerIndex(null)
            setMedicinePickerKeyword('')
            setMedicinePickerOptions([])
            setMedicinePickerError('')
            setMedicinePickerLoading(false)
            setFollowUpSlots([])
            setFollowUpSlotsError('')
            setDiagnosisError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[1200px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HoÃ n táº¥t khÃ¡m & kÃª Ä‘Æ¡n</DialogTitle>
            <DialogDescription>
              HoÃ n thiá»‡n há»“ sÆ¡ khÃ¡m, kÃª thuá»‘c, chá»n dá»‹ch vá»¥ vÃ  táº¡o lá»‹ch tÃ¡i khÃ¡m náº¿u cáº§n.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Bá»‡nh nhÃ¢n</p>
                    <h3 className="text-xl font-semibold text-[#0f172a]">{getPatientName(selectedAppointment)}</h3>
                    <p className="mt-1 text-sm text-[#475569]">
                      MÃ£ lá»‹ch: {safeString(selectedAppointment.appointmentCode) || `#${selectedAppointment.id}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                      {selectedAppointmentTypeLabel}
                    </Badge>
                    <Badge className={`rounded-full border ${selectedStatusBadgeClass}`}>
                      {selectedStatusLabel}
                    </Badge>
                    <Badge className={`rounded-full border ${selectedPaymentView.className}`}>
                      {selectedPaymentView.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-xs text-[#64748b]">NgÃ y khÃ¡m</p>
                    <p className="font-semibold text-[#111827]">{getDateLabel(selectedAppointment)}</p>
                  </div>
                  <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-xs text-[#64748b]">Giá» khÃ¡m</p>
                    <p className="font-semibold text-[#111827]">{getTimeLabel(selectedAppointment)}</p>
                  </div>
                  <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-xs text-[#64748b]">Loáº¡i lá»‹ch</p>
                    <p className="font-semibold text-[#111827]">{selectedAppointmentTypeLabel}</p>
                  </div>
                  <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-xs text-[#64748b]">Tráº¡ng thÃ¡i</p>
                    <p className="font-semibold text-[#111827]">{selectedStatusLabel}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <p className="mb-4 text-sm font-semibold text-[#111827]">Ná»™i dung khÃ¡m</p>
                    <div className="space-y-4">
                      <div>
                        <Label>Triá»‡u chá»©ng</Label>
                        <Textarea
                          value={formState.symptoms}
                          onChange={(event) => setFormState((prev) => ({ ...prev, symptoms: event.target.value }))}
                          placeholder="MÃ´ táº£ triá»‡u chá»©ng bá»‡nh nhÃ¢n..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label>Cháº©n Ä‘oÃ¡n</Label>
                        <Textarea
                          value={formState.diagnosis}
                          onChange={(event) => {
                            const nextDiagnosis = event.target.value
                            setFormState((prev) => ({ ...prev, diagnosis: nextDiagnosis }))
                            if (diagnosisError && nextDiagnosis.trim()) {
                              setDiagnosisError('')
                            }
                          }}
                          placeholder="Nháº­p cháº©n Ä‘oÃ¡n (báº¯t buá»™c)"
                          rows={4}
                        />
                        {diagnosisError && <p className="mt-1 text-xs text-red-600">{diagnosisError}</p>}
                      </div>

                      <div>
                        <Label>Lá»i dáº·n bÃ¡c sÄ©</Label>
                        <Textarea
                          value={formState.advice}
                          onChange={(event) => setFormState((prev) => ({ ...prev, advice: event.target.value }))}
                          placeholder="LÆ°u Ã½ cho bá»‡nh nhÃ¢n sau khÃ¡m..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <Pill className="h-4 w-4 text-sky-600" />
                        KÃª thuá»‘c
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddMedicineRow}>
                        <Plus className="mr-1 h-4 w-4" />
                        ThÃªm dÃ²ng
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-[1080px] w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-[#64748b]">
                            <th className="py-2 pr-2 font-medium w-[190px]">Danh má»¥c</th>
                            <th className="py-2 px-2 font-medium">Thuá»‘c</th>
                            <th className="py-2 px-2 font-medium w-[86px]">SL</th>
                            <th className="py-2 px-2 font-medium w-[140px]">ÄÆ¡n giÃ¡</th>
                            <th className="py-2 px-2 font-medium w-[150px]">ThÃ nh tiá»n</th>
                            <th className="py-2 px-2 font-medium w-[190px]">Liá»u dÃ¹ng</th>
                            <th className="py-2 px-2 font-medium w-[190px]">Ghi chÃº</th>
                            <th className="py-2 pl-2 font-medium w-[58px] text-center">XÃ³a</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formState.medicines.map((item, index) => {
                            const quantity = Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
                              ? Number(item.quantity)
                              : 0
                            const selectedCategory = safeString(item.medicineCategory) || MEDICINE_CATEGORY_ALL
                            const categoryMedicines =
                              selectedCategory === MEDICINE_CATEGORY_ALL
                                ? medicines
                                : medicines.filter(
                                    (medicine) =>
                                      getMedicineCategoryLabel(medicine.medicineCategory) === selectedCategory
                                  )
                            const isCurrentPickerRow = openMedicinePickerIndex === index
                            const currentPickerOptions = isCurrentPickerRow ? medicinePickerOptions : categoryMedicines
                            const filteredMedicineCommandOptions = currentPickerOptions.map((medicine) => {
                              const categoryLabel = getMedicineCategoryLabel(medicine.medicineCategory)
                              const unitLabel = getMedicineUnitLabel(medicine.unit)
                              const stock = Number(medicine.quantity ?? 0)
                              const outOfStock = isMedicineOutOfStock(medicine)
                              return {
                                ...medicine,
                                categoryLabel,
                                unitLabel,
                                stock,
                                outOfStock,
                                searchValue: `${normalizeText(medicine.name)} ${normalizeText(categoryLabel)} ${normalizeText(unitLabel)} ${medicine.name} ${categoryLabel} ${unitLabel} ${String(medicine.id)}`,
                              }
                            })
                            const unitPrice = Number(medicinePriceById.get(item.medicineId) ?? 0)
                            const lineTotal = quantity * unitPrice
                            const selectedMedicine = medicineById.get(String(item.medicineId))
                            const selectedMedicineUnitLabel = getMedicineUnitLabel(selectedMedicine?.unit)
                            const selectedMedicineCategoryLabel = getMedicineCategoryLabel(selectedMedicine?.medicineCategory)
                            const selectedMedicineOutOfStock = isMedicineOutOfStock(selectedMedicine)
                            const selectedMedicineStillValid =
                              selectedMedicine &&
                              (selectedCategory === MEDICINE_CATEGORY_ALL ||
                                selectedMedicineCategoryLabel === selectedCategory)

                            return (
                              <tr key={index} className="border-b last:border-0">
                                <td className="py-2 pr-2 align-top">
                                  <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => handleMedicineCategoryChange(index, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Táº¥t cáº£" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {medicineCategoryOptions.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                          {category.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <Popover
                                    open={openMedicinePickerIndex === index}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setOpenMedicinePickerIndex(index)
                                        setMedicinePickerKeyword('')
                                      } else {
                                        setOpenMedicinePickerIndex(null)
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className="h-10 w-full justify-between font-normal"
                                      >
                                        {selectedMedicineStillValid ? (
                                          <span className="flex min-w-0 items-center gap-2">
                                            <span className="truncate">{selectedMedicine?.name}</span>
                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0 text-[10px] text-slate-600">
                                              {selectedMedicineUnitLabel}
                                            </span>
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">Chọn thuốc</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[420px] p-0" align="start">
                                      <Command>
                                        <CommandInput
                                          placeholder="Tìm thuốc theo tên..."
                                          value={isCurrentPickerRow ? medicinePickerKeyword : ''}
                                          onValueChange={(value) => {
                                            if (openMedicinePickerIndex === index) {
                                              setMedicinePickerKeyword(value)
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <CommandList>
                                          {isCurrentPickerRow && medicinePickerLoading ? (
                                            <div className="px-3 py-4 text-sm text-muted-foreground">
                                              Đang tải danh sách thuốc...
                                            </div>
                                          ) : null}
                                          <CommandEmpty>Không có thuốc trong danh mục này.</CommandEmpty>
                                          <CommandGroup>
                                            {filteredMedicineCommandOptions.map((medicine) => (
                                              <CommandItem
                                                key={medicine.id}
                                                value={medicine.searchValue}
                                                disabled={medicine.outOfStock}
                                                onSelect={() => {
                                                  if (medicine.outOfStock) return
                                                  handleMedicineChange(index, 'medicineId', medicine.id)
                                                  setOpenMedicinePickerIndex(null)
                                                  setMedicinePickerKeyword('')
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    'mr-1 h-4 w-4 shrink-0',
                                                    String(item.medicineId) === String(medicine.id)
                                                      ? 'opacity-100'
                                                      : 'opacity-0'
                                                  )}
                                                />
                                                <div className="flex w-full min-w-0 items-start justify-between gap-3">
                                                  <div className="min-w-0">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                      <span className="truncate">{medicine.name}</span>
                                                      <Badge
                                                        className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0 text-[10px] font-medium text-slate-600"
                                                      >
                                                        {medicine.categoryLabel}
                                                      </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                      Đơn vị: {medicine.unitLabel} • Tồn kho: {medicine.stock}
                                                      {medicine.outOfStock ? ' • Hết hàng' : ''}
                                                    </p>
                                                  </div>
                                                  <span className="whitespace-nowrap text-xs font-semibold text-[#0f172a]">
                                                    {formatCurrencyVnd(Number(medicine.price ?? 0))}
                                                  </span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  {!selectedMedicineStillValid && item.medicineId && (
                                    <p className="mt-1 text-xs text-amber-700">Thuốc đã được reset theo danh mục mới.</p>
                                  )}
                                  {isCurrentPickerRow && medicinePickerError && (
                                    <p className="mt-1 text-xs text-red-600">{medicinePickerError}</p>
                                  )}
                                  {isCurrentPickerRow &&
                                    !medicinePickerLoading &&
                                    !medicinePickerError &&
                                    filteredMedicineCommandOptions.length === 0 &&
                                    !safeString(medicinePickerKeyword) && (
                                      <p className="mt-1 text-xs text-amber-700">
                                        Không có thuốc trong danh mục này.
                                      </p>
                                    )}
                                  {selectedMedicineOutOfStock && item.medicineId && (
                                    <p className="mt-1 text-xs text-amber-700">
                                      Thuốc đã chọn đang hết hàng, vui lòng đổi thuốc khác.
                                    </p>
                                  )}
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <p className="mb-1 text-[11px] text-[#64748b]">Sá»‘ lÆ°á»£ng ({selectedMedicineUnitLabel})</p>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(event) => handleMedicineChange(index, 'quantity', event.target.value)}
                                  />
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <div className="h-10 rounded-md border bg-[#f8fafc] px-3 text-xs font-medium text-[#0f172a] flex items-center">
                                    {formatCurrencyVnd(unitPrice)}
                                  </div>
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <div className="h-10 rounded-md border bg-[#f8fafc] px-3 text-xs font-semibold text-[#0f172a] flex items-center">
                                    {formatCurrencyVnd(lineTotal)}
                                  </div>
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <Input
                                    value={item.dosage}
                                    onChange={(event) => handleMedicineChange(index, 'dosage', event.target.value)}
                                    placeholder="VÃ­ dá»¥: 2 viÃªn/ngÃ y"
                                  />
                                </td>
                                <td className="py-2 px-2 align-top">
                                  <Input
                                    value={item.note}
                                    onChange={(event) => handleMedicineChange(index, 'note', event.target.value)}
                                    placeholder="Ghi chÃº"
                                  />
                                </td>
                                <td className="py-2 pl-2 align-top text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMedicineRow(index)}
                                    disabled={formState.medicines.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-right text-sm">
                      <span className="text-[#64748b]">Táº¡m tÃ­nh thuá»‘c: </span>
                      <span className="font-semibold text-[#111827]">{formatCurrencyVnd(medicinePreviewTotal)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]">
                      <Stethoscope className="h-4 w-4 text-sky-600" />
                      Dá»‹ch vá»¥ y táº¿
                    </div>

                    <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Select
                        value={serviceDraftId || '__none__'}
                        onValueChange={(value) => setServiceDraftId(value === '__none__' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chá»n dá»‹ch vá»¥ Ä‘á»ƒ thÃªm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Chá»n dá»‹ch vá»¥ Ä‘á»ƒ thÃªm</SelectItem>
                          {availableServiceOptions.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={handleAddService} disabled={!serviceDraftId}>
                        <Plus className="mr-1 h-4 w-4" />
                        ThÃªm dá»‹ch vá»¥
                      </Button>
                    </div>

                    {selectedServiceDetails.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-[#64748b]">
                        ChÆ°a chá»n dá»‹ch vá»¥ phÃ¡t sinh.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedServiceDetails.map((service) => (
                          <div
                            key={service.serviceId}
                            className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-[#111827]">{service.name}</p>
                                <p className="text-xs text-[#64748b]">ÄÆ¡n giÃ¡: {formatCurrencyVnd(service.price)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveService(service.serviceId)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            <Input
                              className="mt-2"
                              placeholder="Ghi chÃº dá»‹ch vá»¥"
                              value={service.note}
                              onChange={(event) => handleServiceNoteChange(service.serviceId, event.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 text-right text-sm">
                      <span className="text-[#64748b]">Táº¡m tÃ­nh dá»‹ch vá»¥: </span>
                      <span className="font-semibold text-[#111827]">{formatCurrencyVnd(servicePreviewTotal)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm">
                    <p className="mb-2 font-semibold text-[#0c4a6e]">Tá»•ng chi phÃ­ sau khÃ¡m</p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">
                          {isCurrentAppointmentFollowUp ? 'PhÃ­ khÃ¡m tÃ¡i khÃ¡m (50%)' : 'PhÃ­ khÃ¡m'}
                        </span>
                        {isCurrentAppointmentFollowUp ? (
                          <span className="font-medium text-[#111827]">{formatCurrencyVnd(consultationFeeAppliedPreview)}</span>
                        ) : (
                          <span className="font-medium text-emerald-700">ÄÃ£ thanh toÃ¡n khi Ä‘áº·t lá»‹ch (0 VND)</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Tiá»n thuá»‘c</span>
                        <span className="font-medium text-[#111827]">{formatCurrencyVnd(medicinePreviewTotal)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Tiá»n dá»‹ch vá»¥</span>
                        <span className="font-medium text-[#111827]">{formatCurrencyVnd(servicePreviewTotal)}</span>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-sky-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0f172a]">Tá»•ng cá»™ng</span>
                        <span className="text-lg font-bold text-[#0f172a]">{formatCurrencyVnd(estimatedTotal)}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Tá»•ng = phÃ­ khÃ¡m Ã¡p dá»¥ng + thuá»‘c + dá»‹ch vá»¥
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#e5e7eb] bg-white p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <input
                    type="checkbox"
                    checked={formState.followUpEnabled}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setFormState((prev) => ({
                        ...prev,
                        followUpEnabled: checked,
                        followUpDate: checked ? prev.followUpDate : '',
                        followUpTime: checked ? prev.followUpTime : '',
                        followUpNote: checked ? prev.followUpNote : '',
                      }))

                      if (!checked) {
                        setFollowUpErrors({})
                        setFollowUpSlots([])
                        setFollowUpSlotsError('')
                      }

                      setSubmitError('')
                    }}
                  />
                  Háº¹n tÃ¡i khÃ¡m
                </label>

                {formState.followUpEnabled && (
                  <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
                    <div>
                      <Label className="mb-2 block">NgÃ y tÃ¡i khÃ¡m</Label>
                      <Popover open={isFollowUpDatePickerOpen} onOpenChange={setIsFollowUpDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="h-11 w-full justify-between">
                            {formState.followUpDate ? (
                              <span>{formatDateDisplay(formState.followUpDate)}</span>
                            ) : (
                              <span className="text-muted-foreground">Chá»n ngÃ y tÃ¡i khÃ¡m</span>
                            )}
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateInput(formState.followUpDate) ?? undefined}
                            onSelect={(date) => {
                              if (!date) return
                              const normalizedDate = toDateOnly(date)
                              if (normalizedDate < todayDateOnly) return

                              setFormState((prev) => ({
                                ...prev,
                                followUpDate: formatDateAsIso(normalizedDate),
                                followUpTime: '',
                              }))
                              setFollowUpErrors((prev) => ({ ...prev, date: undefined, time: undefined }))
                              setSubmitError('')
                              setIsFollowUpDatePickerOpen(false)
                            }}
                            disabled={(date) => toDateOnly(date) < todayDateOnly}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {followUpErrors.date && <p className="mt-1 text-xs text-red-600">{followUpErrors.date}</p>}
                    </div>

                    <div>
                      <Label className="mb-2 block">Giá» tÃ¡i khÃ¡m (24h)</Label>
                      {formState.followUpDate ? (
                        <>
                          {followUpSlotsLoading ? (
                            <div className="rounded-xl border border-dashed p-3 text-sm text-[#64748b]">
                              Äang táº£i khung giá»...
                            </div>
                          ) : followUpSlotViews.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {followUpSlotViews.map((slot) => (
                                <button
                                  key={slot.value}
                                  type="button"
                                  disabled={slot.disabled}
                                  onClick={() => {
                                    setFormState((prev) => ({ ...prev, followUpTime: slot.value }))
                                    setSubmitError('')
                                    if (followUpErrors.time) {
                                      setFollowUpErrors((prev) => ({ ...prev, time: undefined }))
                                    }
                                  }}
                                  className={`h-10 rounded-lg border text-sm font-medium transition ${
                                    formState.followUpTime === slot.value
                                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                                      : slot.disabled
                                        ? 'border-slate-200 bg-slate-100 text-slate-400'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                                  }`}
                                >
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed p-3 text-sm text-[#64748b]">
                              KhÃ´ng cÃ³ khung giá» kháº£ dá»¥ng cho ngÃ y nÃ y, vui lÃ²ng chá»n ngÃ y khÃ¡c.
                            </div>
                          )}

                          {followUpSlotsError && (
                            <p className="mt-2 text-xs text-amber-700">{followUpSlotsError}</p>
                          )}
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-[#64748b]">
                          Chá»n ngÃ y trÆ°á»›c Ä‘á»ƒ hiá»ƒn thá»‹ khung giá».
                        </div>
                      )}

                      {followUpErrors.time && <p className="mt-1 text-xs text-red-600">{followUpErrors.time}</p>}
                    </div>

                    <div>
                      <Label className="mb-2 block">Ghi chÃº tÃ¡i khÃ¡m</Label>
                      <Textarea
                        rows={3}
                        value={formState.followUpNote}
                        onChange={(event) => {
                          setFormState((prev) => ({ ...prev, followUpNote: event.target.value }))
                          setSubmitError('')
                        }}
                        placeholder="Dáº·n lá»‹ch tÃ¡i khÃ¡m hoáº·c lÆ°u Ã½ thÃªm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-[#64748b]">
              KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u lá»‹ch háº¹n Ä‘á»ƒ hoÃ n táº¥t khÃ¡m.
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)} disabled={submitting}>
              Há»§y
            </Button>
            <Button type="button" onClick={() => void handleCompleteAppointment()} disabled={submitting || !selectedAppointment}>
              {submitting ? 'Äang xá»­ lÃ½...' : 'XÃ¡c nháº­n'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
