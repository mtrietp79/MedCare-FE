import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Eye, FilePenLine, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
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
import type { AppointmentSlot, AppointmentSlotResponse } from '@/services/api'
import { doctorMedicalRecordService } from '@/services/doctorMedicalRecordService'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { safeString } from '@/lib/admin-normalizers'
import { cn } from '@/lib/utils'
import {
  getAppointmentTypeLabel as getAppointmentTypeDisplayLabel,
  isFollowUpAppointmentType,
} from '@/lib/appointment-type'
import { useToast } from '@/hooks/use-toast'
import { QUERY_KEYS, invalidateQueries } from '@/lib/query-invalidation'
import {
  getAppointmentStatusClass,
  getAppointmentStatusKey,
  getAppointmentStatusLabel,
  resolvePaymentStatusView,
} from '@/lib/appointment-status'
import {
  BillingSummaryPanel,
  MedicineCategorySelect,
  MedicineSelect,
  PrescriptionItemsTable,
  type PrescriptionTableItem,
} from '@/components/doctor/complete-appointment'

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
  key: string
  value: string
  label: string
  disabled: boolean
  state: 'available' | 'full' | 'disabled'
  disabledReason?: string
  disabledMessage?: string
}

interface CompleteResultSummary {
  invoiceTitle?: string
  invoiceFormula?: string
  followUpText?: string
}

interface MedicineDraftErrors {
  category?: string
  medicineId?: string
  quantity?: string
}

const SLOT_DISABLED_REASONS = new Set(['PAST', 'LESS_THAN_2H', 'FULL', 'TOO_FAR', 'NO_SCHEDULE', 'SHIFT_UNAVAILABLE'])
const MEDICINE_CATEGORY_ALL = '__all__'

const initialCompleteForm: CompleteFormState = {
  symptoms: '',
  diagnosis: '',
  advice: '',
  medicines: [],
  medicalServices: [],
  followUpEnabled: false,
  followUpDate: '',
  followUpTime: '',
  followUpNote: '',
}

function createInitialMedicineDraft(): PrescriptionItemForm {
  return {
    medicineCategory: MEDICINE_CATEGORY_ALL,
    medicineId: '',
    quantity: '1',
    dosage: '',
    note: '',
  }
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

function isAllMedicineCategory(value?: string): boolean {
  const normalized = normalizeText(safeString(value))
  return !normalized || normalized === MEDICINE_CATEGORY_ALL || normalized === 'all' || normalized === 'tat ca'
}

function getStatusKey(rawStatus?: string, rawStatusDisplay?: string): 'pending' | 'completed' | 'cancelled' {
  return getAppointmentStatusKey(rawStatus, rawStatusDisplay)
}

function getStatusLabel(rawStatus?: string, rawStatusDisplay?: string): string {
  return getAppointmentStatusLabel(rawStatus, rawStatusDisplay)
}

function getStatusBadgeClass(rawStatus?: string, rawStatusDisplay?: string): string {
  return getAppointmentStatusClass(rawStatus, rawStatusDisplay)
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

function getPaymentStatusView(rawPaymentStatus?: string, rawPaymentStatusDisplay?: string): { label: string; className: string } {
  const view = resolvePaymentStatusView(rawPaymentStatus, rawPaymentStatusDisplay)
  return {
    label: view.label,
    className: view.className,
  }
}

function getAppointmentTypeLabel(appointment: Pick<DoctorAppointment, 'type' | 'appointmentType' | 'typeCode' | 'appointmentTypeCode'>): string {
  return getAppointmentTypeDisplayLabel({
    type: appointment.type,
    appointmentType: appointment.appointmentType,
    typeCode: appointment.typeCode,
    appointmentTypeCode: appointment.appointmentTypeCode,
  })
}

function getAppointmentCanComplete(
  appointment?: Pick<DoctorAppointment, 'canExamine' | 'canComplete'> | null
): boolean {
  return Boolean(appointment?.canExamine ?? appointment?.canComplete ?? false)
}

function getFollowUpFieldErrors(error: any): FollowUpValidationErrors {
  const fieldErrors = error?.response?.data?.fieldErrors
  return {
    date: safeString(fieldErrors?.followUpDate) || undefined,
    time: safeString(fieldErrors?.followUpTime) || undefined,
  }
}

function hasFollowUpFieldErrors(errors: FollowUpValidationErrors): boolean {
  return Boolean(errors.date || errors.time)
}

function getFollowUpSlotDisabledMessage(disabledReason?: string, slotState?: FollowUpSlotView['state']): string {
  const normalizedReason = safeString(disabledReason).toUpperCase()
  switch (normalizedReason) {
    case 'PAST':
    case 'LESS_THAN_2H':
      return 'Khung gio da qua'
    case 'NO_SCHEDULE':
      return 'Bac si khong co lich lam viec ngay nay'
    case 'SHIFT_UNAVAILABLE':
      return 'Bac si khong lam viec buoi nay'
    case 'FULL':
      return 'Khung gio da du so luong benh nhan'
    default:
      return slotState && slotState !== 'available' ? 'Khung gio hien khong kha dung' : ''
  }
}

function getFollowUpSlotButtonClass(slotState: FollowUpSlotView['state'], selected: boolean): string {
  return cn(
    'relative flex h-14 min-w-0 items-center justify-center rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition-colors',
    selected && 'border-sky-700 bg-sky-100 text-sky-950 shadow-sm',
    !selected && slotState === 'available' && 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900',
    !selected && slotState === 'full' && 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700',
    !selected && slotState === 'disabled' && 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
  )
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
  return (
    isFollowUpAppointmentType(
      appointment.typeCode,
      appointment.appointmentTypeCode
    ) ||
    (!appointment.typeCode &&
      !appointment.appointmentTypeCode &&
      Boolean(appointment.parentAppointmentId))
  )
}

export function DoctorAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [medicines, setMedicines] = useState<DoctorMedicine[]>([])
  const [medicineCategories, setMedicineCategories] = useState<string[]>([])
  const [medicineCategoriesLoading, setMedicineCategoriesLoading] = useState(false)
  const [medicineCategoriesError, setMedicineCategoriesError] = useState('')
  const [medicinePickerKeyword, setMedicinePickerKeyword] = useState('')
  const [medicinePickerOptions, setMedicinePickerOptions] = useState<DoctorMedicine[]>([])
  const [medicinePickerLoading, setMedicinePickerLoading] = useState(false)
  const [medicinePickerError, setMedicinePickerError] = useState('')
  const [medicinePickerRetrySeed, setMedicinePickerRetrySeed] = useState(0)
  const [isMedicinePickerOpen, setIsMedicinePickerOpen] = useState(false)
  const [medicineDraft, setMedicineDraft] = useState<PrescriptionItemForm>(createInitialMedicineDraft())
  const [medicineDraftErrors, setMedicineDraftErrors] = useState<MedicineDraftErrors>({})
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
  const [followUpSlots, setFollowUpSlots] = useState<AppointmentSlotResponse[]>([])
  const [followUpSlotsLoading, setFollowUpSlotsLoading] = useState(false)
  const [followUpSlotsError, setFollowUpSlotsError] = useState('')
  const [isFollowUpDatePickerOpen, setIsFollowUpDatePickerOpen] = useState(false)
  const [serviceDraftId, setServiceDraftId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [completeResultSummary, setCompleteResultSummary] = useState<CompleteResultSummary | null>(null)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const debouncedMedicinePickerKeyword = useDebouncedValue(medicinePickerKeyword, 300)

  const refreshAppointmentsList = async () => {
    const appointmentsResult = await doctorAppointmentService.getAppointments()
    const normalizedAppointments = Array.isArray(appointmentsResult) ? appointmentsResult : []
    const nextAppointments = normalizedAppointments.filter((item) => !isServicePackageBooking(item))
    setAppointments(nextAppointments)
    return nextAppointments
  }

  const loadMedicineCategories = async () => {
    setMedicineCategoriesLoading(true)
    setMedicineCategoriesError('')

    try {
      const categoriesResult = await doctorAppointmentService.getMedicineCategories()
      const normalized = Array.isArray(categoriesResult)
        ? categoriesResult.map((item) => safeString(item)).filter(Boolean)
        : []
      setMedicineCategories(normalized)
      return normalized
    } catch (categoryError: any) {
      setMedicineCategories([])
      setMedicineCategoriesError(getBackendErrorMessage(categoryError, 'Không thể tải danh mục thuốc.'))
      return []
    } finally {
      setMedicineCategoriesLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      await refreshAppointmentsList()

      const [medicinesResult, servicesResult] = await Promise.allSettled([
        doctorAppointmentService.getMedicines(),
        doctorAppointmentService.getMedicalServices(),
        loadMedicineCategories(),
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
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách lịch hẹn.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  const selectedAppointmentTypeLabel = useMemo(
    () => (selectedAppointment ? getAppointmentTypeLabel(selectedAppointment) : 'Khám bệnh'),
    [selectedAppointment]
  )

  const isCurrentAppointmentFollowUp = useMemo(
    () => (selectedAppointment ? isFollowUpAppointment(selectedAppointment) : false),
    [selectedAppointment]
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
      if (isAllMedicineCategory(normalizedCategory)) return
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
    const category = safeString(medicineDraft.medicineCategory)
    return isAllMedicineCategory(category) ? MEDICINE_CATEGORY_ALL : category
  }, [medicineDraft.medicineCategory])

  const selectedDraftMedicine = useMemo(
    () => medicineById.get(String(medicineDraft.medicineId)) || null,
    [medicineById, medicineDraft.medicineId]
  )

  const draftQuantityValue = useMemo(() => {
    const quantity = Number(medicineDraft.quantity)
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
  }, [medicineDraft.quantity])

  const draftUnitPrice = Number(selectedDraftMedicine?.price ?? 0)
  const draftLineTotal = draftQuantityValue * draftUnitPrice

  const prescriptionTableItems = useMemo<PrescriptionTableItem[]>(
    () =>
      formState.medicines
        .map((item) => {
          const medicine = medicineById.get(String(item.medicineId))
          if (!medicine) return null

          const quantity = Number(item.quantity)
          const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
          const unitPrice = Number(medicine.price ?? 0)

          return {
            medicineId: String(item.medicineId),
            name: medicine.name,
            category: getMedicineCategoryLabel(medicine.medicineCategory),
            unit: getMedicineUnitLabel(medicine.unit),
            quantity: safeQuantity,
            unitPrice,
            lineTotal: safeQuantity * unitPrice,
            dosage: item.dosage,
            note: item.note,
          }
        })
        .filter((item): item is PrescriptionTableItem => item !== null),
    [formState.medicines, medicineById]
  )

  const filteredMedicineByCategory = useMemo(() => {
    if (activeMedicinePickerCategory === MEDICINE_CATEGORY_ALL) return medicines
    return medicines.filter(
      (medicine) => getMedicineCategoryLabel(medicine.medicineCategory) === activeMedicinePickerCategory
    )
  }, [activeMedicinePickerCategory, medicines])

  const medicineSelectOptions = useMemo(
    () => (isMedicinePickerOpen ? medicinePickerOptions : filteredMedicineByCategory),
    [filteredMedicineByCategory, isMedicinePickerOpen, medicinePickerOptions]
  )

  const draftUnitLabel = getMedicineUnitLabel(selectedDraftMedicine?.unit)

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
      const type = normalizeText(getAppointmentTypeLabel(appointment))
      const status = normalizeText(getStatusLabel(appointment.status, appointment.statusDisplay))
      return [patient, date, type, status].some((value) => value.includes(keywordLower))
    })
  }, [appointments, keyword])

  const followUpSlotViews = useMemo<FollowUpSlotView[]>(() => {
    const selectedDateKey = formState.followUpDate || 'follow-up'

    const mapped: FollowUpSlotView[] = []
    followUpSlots.forEach((slot) => {
      const value = slot.time // New format: already in "HH:mm" format
      
      // Determine state based on new response format
      const state: FollowUpSlotView['state'] = slot.available ? 'available' : 'full'
      const disabled = !slot.available
      
      // Build display label with remaining slots
      const slotCountLabel = slot.remainingSlots > 0 
        ? `còn ${slot.remainingSlots}/${slot.totalSlots}`
        : 'Hết slot'
      const label = `${value} (${slotCountLabel})`
      
      const disabledMessage = !slot.available 
        ? slot.remainingSlots === 0 
          ? 'Hết slot'
          : 'Khung giờ này không khả dụng'
        : undefined

      mapped.push({
        key: `${selectedDateKey}-${value}`,
        value,
        label,
        disabled,
        state,
        disabledMessage,
      })
    })

    return mapped
  }, [followUpSlots, formState.followUpDate])

  const hasAvailableFollowUpSlots = useMemo(
    () => followUpSlotViews.some((slot) => slot.state === 'available'),
    [followUpSlotViews]
  )

  useEffect(() => {
    if (!formState.followUpEnabled || !formState.followUpDate || !selectedAppointment?.id) {
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
        const slotsResult = await doctorAppointmentService.getFollowUpSlotsForAppointment(
          String(selectedAppointment.id),
          formState.followUpDate
        )
        if (!active) return
        setFollowUpSlots(Array.isArray(slotsResult) ? slotsResult : [])
      } catch (slotError: any) {
        if (!active) return
        setFollowUpSlots([])
        setFollowUpSlotsError(
          getBackendErrorMessage(slotError, 'Không thể tải khung giờ tái khám khả dụng.')
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
  }, [formState.followUpDate, formState.followUpEnabled, selectedAppointment?.id])

  useEffect(() => {
    if (!formState.followUpTime) return
    const selected = followUpSlotViews.find((slot) => slot.value === formState.followUpTime)
    if (!selected || selected.disabled) {
      setFormState((prev) => ({ ...prev, followUpTime: '' }))
    }
  }, [followUpSlotViews, formState.followUpTime])

  useEffect(() => {
    if (!completeOpen) {
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
        const normalizedResult = Array.isArray(result) ? result : []
        setMedicinePickerOptions(normalizedResult)

        setMedicines((prev) => {
          if (normalizedResult.length === 0) return prev
          const byId = new Map<string, DoctorMedicine>()
          prev.forEach((item) => byId.set(String(item.id), item))
          normalizedResult.forEach((item) => byId.set(String(item.id), item))
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
  }, [activeMedicinePickerCategory, completeOpen, debouncedMedicinePickerKeyword, medicinePickerRetrySeed])

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
    if (!getAppointmentCanComplete(appointment)) return

    setSelectedAppointment(appointment)
    setFollowUpErrors({})
    setFollowUpSlots([])
    setFollowUpSlotsError('')
    setIsFollowUpDatePickerOpen(false)
    setIsMedicinePickerOpen(false)
    setMedicinePickerKeyword('')
    setMedicinePickerOptions([])
    setMedicinePickerError('')
    setMedicinePickerLoading(false)
    setMedicineDraft(createInitialMedicineDraft())
    setMedicineDraftErrors({})
    setServiceDraftId('')
    setSubmitError('')
    setDiagnosisError('')
    const fallbackSymptoms = safeString(appointment.symptoms)
    setInitialSymptoms(fallbackSymptoms)
    setFormState({
      ...initialCompleteForm,
      symptoms: fallbackSymptoms,
      medicines: [],
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

  const handleMedicineDraftFieldChange = (field: keyof PrescriptionItemForm, value: string) => {
    setMedicineDraft((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleMedicineCategoryChange = (nextCategory: string) => {
    setMedicineDraft((prev) => ({
      ...prev,
      medicineCategory: nextCategory,
      medicineId: '',
    }))
    setMedicinePickerRetrySeed((prev) => prev + 1)
    setMedicineDraftErrors((prev) => ({
      ...prev,
      category: undefined,
      medicineId: undefined,
    }))
    setSubmitError('')
  }

  const handleSelectMedicine = (medicine: DoctorMedicine) => {
    setMedicineDraft((prev) => ({ ...prev, medicineId: String(medicine.id) }))
    setMedicineDraftErrors((prev) => ({ ...prev, medicineId: undefined }))
    setSubmitError('')
  }

  const handleRemoveMedicineItem = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleAddMedicineItem = () => {
    const nextErrors: MedicineDraftErrors = {}

    const selectedCategory = safeString(medicineDraft.medicineCategory)
    const selectedMedicineId = safeString(medicineDraft.medicineId)
    const quantity = Number(medicineDraft.quantity)

    if (!selectedCategory) {
      nextErrors.category = 'Vui lòng chọn danh mục thuốc.'
    }

    if (!selectedMedicineId) {
      nextErrors.medicineId = 'Vui lòng chọn thuốc.'
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = 'Số lượng phải lớn hơn 0.'
    }

    const selectedMedicine = selectedMedicineId ? medicineById.get(selectedMedicineId) : null
    if (selectedMedicine && isMedicineOutOfStock(selectedMedicine)) {
      nextErrors.medicineId = 'Thuốc đã hết hàng, vui lòng chọn thuốc khác.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setMedicineDraftErrors(nextErrors)
      return
    }

    setMedicineDraftErrors({})

    setFormState((prev) => {
      const duplicateIndex = prev.medicines.findIndex((item) => String(item.medicineId) === selectedMedicineId)
      if (duplicateIndex >= 0) {
        const shouldMerge = window.confirm('Thuốc đã tồn tại trong đơn. Bạn có muốn gộp số lượng không?')
        if (!shouldMerge) {
          return prev
        }

        return {
          ...prev,
          medicines: prev.medicines.map((item, index) => {
            if (index !== duplicateIndex) return item

            const mergedQuantity = Number(item.quantity || '0') + quantity
            return {
              ...item,
              quantity: String(mergedQuantity),
              dosage: medicineDraft.dosage.trim() || item.dosage,
              note: medicineDraft.note.trim() || item.note,
            }
          }),
        }
      }

      return {
        ...prev,
        medicines: [
          ...prev.medicines,
          {
            medicineCategory: selectedCategory || MEDICINE_CATEGORY_ALL,
            medicineId: selectedMedicineId,
            quantity: String(quantity),
            dosage: medicineDraft.dosage.trim(),
            note: medicineDraft.note.trim(),
          },
        ],
      }
    })

    setMedicineDraft((prev) => ({
      ...createInitialMedicineDraft(),
      medicineCategory: prev.medicineCategory || MEDICINE_CATEGORY_ALL,
    }))
    setMedicinePickerKeyword('')
    setSubmitError('')
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
      nextErrors.date = 'Vui lòng chọn ngày tái khám.'
    } else {
      const now = new Date()
      const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      if (formState.followUpDate < localToday) {
        nextErrors.date = 'Ngày tái khám không được ở quá khứ.'
      }
    }

    if (!formState.followUpTime) {
      nextErrors.time = 'Vui lòng chọn giờ tái khám.'
    }

    if (!nextErrors.date && !nextErrors.time && formState.followUpDate && formState.followUpTime) {
      const followUpDateTime = new Date(`${formState.followUpDate}T${formState.followUpTime}:00`)
      if (Number.isNaN(followUpDateTime.getTime()) || followUpDateTime.getTime() <= Date.now()) {
        nextErrors.time = 'Giờ tái khám phải lớn hơn thời điểm hiện tại.'
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
        statusDisplay: safeString(result.statusDisplay) || appointment.statusDisplay,
        canExamine: false,
        canComplete: false,
        appointmentType: result.appointmentType || appointment.appointmentType || appointment.type,
        typeCode: appointment.typeCode,
        appointmentTypeCode: appointment.appointmentTypeCode,
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
          appointmentCode: followUp.appointmentCode,
          canExamine: false,
          canComplete: false,
          appointmentDate: followUp.appointmentDate,
          appointmentTime: followUp.appointmentTime,
          appointmentTimeLabel: followUp.appointmentTime,
          time: followUp.appointmentTime,
          appointmentType: followUp.appointmentType || followUp.type || 'Tái khám',
          typeCode: followUp.typeCode,
          appointmentTypeCode: followUp.appointmentTypeCode,
          status: followUp.status || 'PENDING',
          statusDisplay: followUp.statusDisplay,
          consultationFee: followUp.consultationFee,
          paymentStatus: followUp.paymentStatus,
          paymentStatusDisplay: followUp.paymentStatusDisplay,
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
      setDiagnosisError('Vui lòng nhập chẩn đoán trước khi xác nhận.')
      setSubmitError('Vui lòng nhập chẩn đoán trước khi xác nhận.')
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
    const normalizedFollowUpTime = formState.followUpEnabled
      ? extractTimeLabelFromDateTime(formState.followUpTime) || formState.followUpTime
      : undefined

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
      followUp: formState.followUpEnabled
        ? {
            needFollowUp: true,
            followUpDate: formState.followUpDate || undefined,
            followUpTime: normalizedFollowUpTime || undefined,
            note: formState.followUpNote.trim() || undefined,
          }
        : {
            needFollowUp: false,
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
              canExamine: false,
              canComplete: false,
              appointmentType: completeResult.appointmentType || prev.appointmentType || prev.type,
              typeCode: prev.typeCode,
              appointmentTypeCode: prev.appointmentTypeCode,
              symptoms: shouldSendSymptoms ? normalizedCurrentSymptoms : prev.symptoms,
            }
          : prev
      )

      const syncResults = await Promise.allSettled([
        refreshAppointmentsList(),
        doctorAppointmentService.getAppointmentById(appointmentId),
        doctorMedicalRecordService.getSummary(),
        doctorMedicalRecordService.getPatients(''),
      ])

      const appointmentDetailResult = syncResults[1]
      if (appointmentDetailResult.status === 'fulfilled') {
        const refreshedAppointment = appointmentDetailResult.value
        setSelectedAppointment((prev) =>
          prev && String(prev.id) === appointmentId
            ? mergeDefinedAppointmentFields(prev, refreshedAppointment ?? {})
            : prev
        )
      }

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
          'Hoàn tất khám thành công nhưng chưa đồng bộ được toàn bộ dữ liệu.'
        )
        toast({
          title: 'Cảnh báo',
          description: syncErrorMessage,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Thành công', description: 'Đã hoàn tất lịch khám.' })
        if (completeResult.followUpAppointment) {
          toast({ title: 'Tái khám', description: 'Đã tạo lịch tái khám thành công.' })
        }
      }

      const consultationFee = Number(completeResult.invoice?.consultationFee ?? 0)
      const medicineTotal = Number(completeResult.invoice?.medicineTotal ?? 0)
      const serviceTotal = Number(completeResult.invoice?.serviceTotal ?? 0)
      const consultationFeeApplied = isCurrentAppointmentFollowUp ? consultationFee : 0
      const calculatedTotal = consultationFeeApplied + medicineTotal + serviceTotal
      const invoiceTotal = Number(completeResult.invoice?.totalAmount ?? calculatedTotal)

      const invoiceTitle = completeResult.invoice
        ? `Hóa đơn #${completeResult.invoice.id || '-'}`
        : undefined
      const invoiceFormula = completeResult.invoice
        ? isCurrentAppointmentFollowUp
          ? `Tổng tiền = Phí khám + Tiền thuốc + Tiền dịch vụ: ${formatCurrencyVnd(invoiceTotal)} = ${formatCurrencyVnd(
              consultationFeeApplied
            )} + ${formatCurrencyVnd(medicineTotal)} + ${formatCurrencyVnd(serviceTotal)}`
          : `Tổng tiền = Tiền thuốc + Tiền dịch vụ: ${formatCurrencyVnd(invoiceTotal)} = ${formatCurrencyVnd(
              medicineTotal
            )} + ${formatCurrencyVnd(serviceTotal)}`
        : undefined
      const followUpReference = safeString(
        completeResult.followUpAppointment?.appointmentCode ?? completeResult.followUpAppointment?.id
      )
      const followUpText = followUpReference
        ? `Đã tạo lịch tái khám ${followUpReference}.`
        : undefined
      setCompleteResultSummary({ invoiceTitle, invoiceFormula, followUpText })

      setCompleteOpen(false)
      setFormState(initialCompleteForm)
      setInitialSymptoms('')
      setDiagnosisError('')
      setFollowUpErrors({})
      setFollowUpSlots([])
      setFollowUpSlotsError('')
      setSubmitError('')
    } catch (submitError: any) {
      const status = Number(submitError?.response?.status)
      const fieldErrors = getFollowUpFieldErrors(submitError)
      const hasFieldErrors = status === 400 && hasFollowUpFieldErrors(fieldErrors)
      const backendMessage = safeString(submitError?.response?.data?.message)

      if (status === 400 && formState.followUpEnabled) {
        setFollowUpErrors(fieldErrors)
      } else if (formState.followUpEnabled) {
        setFollowUpErrors({})
      }

      if (status === 400) {
        const validationMessage = hasFieldErrors
          ? ''
          : backendMessage || 'Vui lòng kiểm tra lại thông tin lịch tái khám.'
        setSubmitError(validationMessage)
        if (validationMessage) {
          toast({
            title: 'Lỗi',
            description: validationMessage,
            variant: 'destructive',
          })
        }
      } else {
        const fallbackMessage =
          status >= 500
            ? 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
            : 'Không thể hoàn tất lịch khám.'
        const errorMessage = getBackendErrorMessage(submitError, fallbackMessage)
        setSubmitError(errorMessage)
        toast({
          title: 'Lỗi',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleCompleteAppointment()
  }

  const handleCompleteFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return
    const target = event.target as HTMLElement
    if (target.tagName.toLowerCase() === 'textarea') return
    if (target.closest('[data-slot="command"]')) return
    if ((target as HTMLButtonElement).type === 'submit') return
    event.preventDefault()
  }

  const handleSaveDraft = () => {
    if (!selectedAppointment?.id) return

    try {
      const draftKey = `doctor-complete-draft:${selectedAppointment.id}`
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formState,
          medicineDraft,
        })
      )

      toast({
        title: 'Đã lưu nháp',
        description: 'Dữ liệu hoàn tất khám đã được lưu tạm trên trình duyệt.',
      })
    } catch {
      toast({
        title: 'Không thể lưu nháp',
        description: 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    }
  }

  const selectedStatusLabel = selectedAppointment
    ? getStatusLabel(selectedAppointment.status, selectedAppointment.statusDisplay)
    : '-'
  const selectedStatusBadgeClass = getStatusBadgeClass(
    selectedAppointment?.status,
    selectedAppointment?.statusDisplay
  )
  const selectedPaymentView = getPaymentStatusView(
    selectedAppointment?.paymentStatus,
    selectedAppointment?.paymentStatusDisplay
  )
  const todayDateOnly = toDateOnly(new Date())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Lịch hẹn</h1>
        <p className="text-[#6b7280]">Quản lý lịch khám của bệnh nhân</p>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tìm theo bệnh nhân, ngày khám, trạng thái..."
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
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Ngày giờ</TableHead>
                  <TableHead>Loại khám</TableHead>
                  <TableHead>Phí khám</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const statusLabel = getStatusLabel(appointment.status, appointment.statusDisplay)
                  const statusKey = getStatusKey(appointment.status, appointment.statusDisplay)
                  const appointmentType = getAppointmentTypeLabel(appointment)
                  const canComplete = getAppointmentCanComplete(appointment)

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
                          <div className="text-xs text-[#6b7280]">Lịch gốc: #{appointment.parentAppointmentId}</div>
                        )}
                        {safeString(appointment.followUpNote) && (
                          <div className="text-xs text-[#6b7280]">Ghi chú tái khám: {safeString(appointment.followUpNote)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.consultationFee !== undefined ? (
                          <div className="text-sm font-medium">{formatCurrencyVnd(appointment.consultationFee)}</div>
                        ) : (
                          <div className="text-sm text-[#6b7280]">-</div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge className={`rounded-full border ${getPaymentStatusView(
                          appointment.paymentStatus,
                          appointment.paymentStatusDisplay
                        ).className}`}>
                          {getPaymentStatusView(appointment.paymentStatus, appointment.paymentStatusDisplay).label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge className={`rounded-full border ${getStatusBadgeClass(appointment.status, appointment.statusDisplay)}`}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {statusKey === 'cancelled' && (
                          <Badge className="rounded-full border bg-red-50 text-red-700 border-red-200">Đã hủy</Badge>
                        )}

                        {statusKey !== 'cancelled' && (
                          <div className="inline-flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => void openDetail(appointment)}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {canComplete && (
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
                      Không có lịch hẹn phù hợp.
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
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
            <DialogDescription>Thông tin cuộc hẹn của bệnh nhân</DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="grid gap-3 text-sm">
              <div><span className="font-semibold">Bệnh nhân:</span> {getPatientName(selectedAppointment)}</div>
              <div><span className="font-semibold">Ngày khám:</span> {getDateLabel(selectedAppointment)}</div>
              <div><span className="font-semibold">Giờ khám:</span> {getTimeLabel(selectedAppointment)}</div>
              <div>
                <span className="font-semibold">Loại khám:</span>{' '}
                {getAppointmentTypeLabel(selectedAppointment)}
              </div>
              <div><span className="font-semibold">Trạng thái:</span> {getStatusLabel(selectedAppointment.status, selectedAppointment.statusDisplay)}</div>
              <div>
                <span className="font-semibold">Phí khám:</span>{' '}
                {selectedAppointment.consultationFee !== undefined
                  ? formatCurrencyVnd(selectedAppointment.consultationFee)
                  : '-'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Thanh toán:</span>
                <Badge
                  className={`rounded-full border ${getPaymentStatusView(
                    selectedAppointment.paymentStatus,
                    selectedAppointment.paymentStatusDisplay
                  ).className}`}
                >
                  {getPaymentStatusView(selectedAppointment.paymentStatus, selectedAppointment.paymentStatusDisplay).label}
                </Badge>
              </div>
              {selectedAppointment.parentAppointmentId && (
                <div><span className="font-semibold">Lịch gốc:</span> #{selectedAppointment.parentAppointmentId}</div>
              )}
              {isFollowUpAppointment(selectedAppointment) ? (
                <div><span className="font-semibold">Ghi chú tái khám:</span> {safeString(selectedAppointment.followUpNote) || '-'}</div>
              ) : safeString(selectedAppointment.followUpNote) ? (
                <div><span className="font-semibold">Ghi chú tái khám:</span> {safeString(selectedAppointment.followUpNote)}</div>
              ) : null}
              <div><span className="font-semibold">Triệu chứng:</span> {safeString(selectedAppointment.symptoms) || '-'}</div>
              {!isFollowUpAppointment(selectedAppointment) && safeString(selectedAppointment.notes) && (
                <div><span className="font-semibold">Ghi chú:</span> {safeString(selectedAppointment.notes)}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
            {getAppointmentCanComplete(selectedAppointment) ? (
              <Button
                onClick={() => {
                  setDetailOpen(false)
                  if (selectedAppointment) {
                    void openComplete(selectedAppointment)
                  }
                }}
              >
                Xác nhận hoàn tất khám
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={completeOpen}
        onOpenChange={(nextOpen) => {
          setCompleteOpen(nextOpen)
          if (!nextOpen) {
            setServiceDraftId('')
            setIsFollowUpDatePickerOpen(false)
            setIsMedicinePickerOpen(false)
            setMedicinePickerKeyword('')
            setMedicinePickerOptions([])
            setMedicinePickerError('')
            setMedicinePickerLoading(false)
            setMedicineDraft(createInitialMedicineDraft())
            setMedicineDraftErrors({})
            setFollowUpSlots([])
            setFollowUpSlotsError('')
            setDiagnosisError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[1240px] max-h-[92vh] overflow-hidden p-0">
          <form onSubmit={handleCompleteFormSubmit} onKeyDown={handleCompleteFormKeyDown} className="flex max-h-[92vh] flex-col">
            <div className="overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
              <DialogHeader className="mb-4 space-y-1 text-left">
                <DialogTitle className="text-lg font-semibold">Hoàn tất khám & kê đơn</DialogTitle>
                <DialogDescription className="text-sm">
                  Ghi nhận nội dung khám, kê thuốc, thêm dịch vụ và hẹn tái khám nếu cần.
                </DialogDescription>
              </DialogHeader>

              {selectedAppointment ? (
                <div className="mx-auto w-full max-w-[1280px] space-y-5">
                  <section className="rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bệnh nhân</p>
                        <h3 className="text-xl font-semibold text-slate-900">{getPatientName(selectedAppointment)}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Mã lịch: {safeString(selectedAppointment.appointmentCode) || `#${selectedAppointment.id}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                          {selectedAppointmentTypeLabel}
                        </Badge>
                        <Badge className={`rounded-md border px-2.5 py-1 text-xs ${selectedStatusBadgeClass}`}>
                          {selectedStatusLabel}
                        </Badge>
                        <Badge className={`rounded-md border px-2.5 py-1 text-xs ${selectedPaymentView.className}`}>
                          {selectedPaymentView.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Ngày khám</p>
                        <p className="text-sm font-semibold text-slate-900">{getDateLabel(selectedAppointment)}</p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Giờ khám</p>
                        <p className="text-sm font-semibold text-slate-900">{getTimeLabel(selectedAppointment)}</p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Loại lịch</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedAppointmentTypeLabel}</p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Trạng thái</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedStatusLabel}</p>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                    <section className="rounded-lg border border-slate-200 p-4 xl:col-span-12">
                      <h3 className="text-base font-semibold text-slate-900">Nội dung khám</h3>
                      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="xl:col-span-4">
                          <Label className="mb-1.5 block text-xs font-medium text-slate-600">Triệu chứng</Label>
                          <Textarea
                            value={formState.symptoms}
                            onChange={(event) => setFormState((prev) => ({ ...prev, symptoms: event.target.value }))}
                            placeholder="Mô tả triệu chứng bệnh nhân..."
                            rows={4}
                            className="min-h-[108px]"
                          />
                        </div>
                        <div className="xl:col-span-4">
                          <Label className="mb-1.5 block text-xs font-medium text-slate-600">Chẩn đoán</Label>
                          <Textarea
                            value={formState.diagnosis}
                            onChange={(event) => {
                              const nextDiagnosis = event.target.value
                              setFormState((prev) => ({ ...prev, diagnosis: nextDiagnosis }))
                              if (diagnosisError && nextDiagnosis.trim()) {
                                setDiagnosisError('')
                              }
                              if (nextDiagnosis.trim()) {
                                setSubmitError('')
                              }
                            }}
                            placeholder="Nhập chẩn đoán (bắt buộc)"
                            rows={4}
                            className="min-h-[108px]"
                          />
                          {diagnosisError ? <p className="mt-1 text-xs text-red-600">{diagnosisError}</p> : null}
                        </div>
                        <div className="xl:col-span-4">
                          <Label className="mb-1.5 block text-xs font-medium text-slate-600">Lời dặn bác sĩ</Label>
                          <Textarea
                            value={formState.advice}
                            onChange={(event) => setFormState((prev) => ({ ...prev, advice: event.target.value }))}
                            placeholder="Lưu ý cho bệnh nhân sau khám..."
                            rows={4}
                            className="min-h-[108px]"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 p-4 xl:col-span-12">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-sky-600" />
                        <h3 className="text-base font-semibold text-slate-900">Kê thuốc</h3>
                      </div>

                      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <MedicineCategorySelect
                            value={medicineDraft.medicineCategory}
                            options={medicineCategoryOptions}
                            loading={medicineCategoriesLoading}
                            error={medicineCategoriesError}
                            onRetry={() => void loadMedicineCategories()}
                            onValueChange={handleMedicineCategoryChange}
                          />

                          <MedicineSelect
                            open={isMedicinePickerOpen}
                            keyword={medicinePickerKeyword}
                            selectedMedicine={selectedDraftMedicine}
                            selectedMedicineId={medicineDraft.medicineId}
                            options={medicineSelectOptions}
                            loading={medicinePickerLoading}
                            error={medicinePickerError}
                            disabled={medicineCategoriesLoading}
                            onRetry={() => setMedicinePickerRetrySeed((prev) => prev + 1)}
                            onOpenChange={(open) => {
                              setIsMedicinePickerOpen(open)
                              if (open) {
                                setMedicinePickerError('')
                              }
                            }}
                            onKeywordChange={setMedicinePickerKeyword}
                            onSelectMedicine={handleSelectMedicine}
                            onClearFilter={() => setMedicinePickerKeyword('')}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-2">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Số lượng ({draftUnitLabel})</Label>
                            <Input
                              type="number"
                              min={1}
                              value={medicineDraft.quantity}
                              onChange={(event) => {
                                handleMedicineDraftFieldChange('quantity', event.target.value)
                                setMedicineDraftErrors((prev) => ({ ...prev, quantity: undefined }))
                              }}
                              className="h-11"
                            />
                            {medicineDraftErrors.quantity ? (
                              <p className="mt-1 text-xs text-red-600">{medicineDraftErrors.quantity}</p>
                            ) : null}
                          </div>
                          <div className="md:col-span-3">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Đơn giá</Label>
                            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
                              {formatCurrencyVnd(draftUnitPrice)}
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Thành tiền</Label>
                            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
                              {formatCurrencyVnd(draftLineTotal)}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Liều dùng</Label>
                            <Input
                              value={medicineDraft.dosage}
                              onChange={(event) => handleMedicineDraftFieldChange('dosage', event.target.value)}
                              className="h-11"
                              placeholder="VD: 2 viên/ngày"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Ghi chú</Label>
                            <Input
                              value={medicineDraft.note}
                              onChange={(event) => handleMedicineDraftFieldChange('note', event.target.value)}
                              className="h-11"
                              placeholder="Ghi chú"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-1">
                            {medicineDraftErrors.category ? (
                              <p className="text-xs text-red-600">{medicineDraftErrors.category}</p>
                            ) : null}
                            {medicineDraftErrors.medicineId ? (
                              <p className="text-xs text-red-600">{medicineDraftErrors.medicineId}</p>
                            ) : null}
                          </div>

                          <Button type="button" onClick={handleAddMedicineItem} className="h-10">
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm thuốc
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <PrescriptionItemsTable items={prescriptionTableItems} onDeleteItem={handleRemoveMedicineItem} />
                      </div>

                      <div className="mt-3 text-right text-sm">
                        <span className="text-slate-600">Tạm tính thuốc: </span>
                        <span className="font-semibold text-slate-900">{formatCurrencyVnd(medicinePreviewTotal)}</span>
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 p-4 xl:col-span-12">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-sky-600" />
                        <h3 className="text-base font-semibold text-slate-900">Dịch vụ y tế phát sinh</h3>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Select
                          value={serviceDraftId || '__none__'}
                          onValueChange={(value) => setServiceDraftId(value === '__none__' ? '' : value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Chọn dịch vụ để thêm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Chọn dịch vụ để thêm</SelectItem>
                            {availableServiceOptions.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={handleAddService} disabled={!serviceDraftId} className="h-11">
                          <Plus className="mr-1 h-4 w-4" />
                          Thêm dịch vụ
                        </Button>
                      </div>

                      {selectedServiceDetails.length === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                          Chưa chọn dịch vụ phát sinh.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {selectedServiceDetails.map((service) => (
                            <div key={service.serviceId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-slate-900">{service.name}</p>
                                  <p className="text-xs text-slate-600">Đơn giá: {formatCurrencyVnd(service.price)}</p>
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
                                className="mt-2 h-10"
                                placeholder="Ghi chú dịch vụ"
                                value={service.note}
                                onChange={(event) => handleServiceNoteChange(service.serviceId, event.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-right text-sm">
                        <span className="text-slate-600">Tạm tính dịch vụ: </span>
                        <span className="font-semibold text-slate-900">{formatCurrencyVnd(servicePreviewTotal)}</span>
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 p-4 xl:col-span-12">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">Hẹn tái khám</h3>
                          <p className="text-xs text-slate-500">Bật lịch tái khám nếu cần theo dõi sau điều trị.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={formState.followUpEnabled}
                            onCheckedChange={(checked) => {
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
                          <span className="text-sm font-medium text-slate-700">Hẹn tái khám</span>
                        </div>
                      </div>

                      {formState.followUpEnabled ? (
                        <div className="mt-3 grid gap-3 xl:grid-cols-12">
                          <div className="xl:col-span-4">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Ngày tái khám</Label>
                            <Popover open={isFollowUpDatePickerOpen} onOpenChange={setIsFollowUpDatePickerOpen}>
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" className="h-11 w-full justify-between">
                                  {formState.followUpDate ? (
                                    <span>{formatDateDisplay(formState.followUpDate)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">Chọn ngày tái khám</span>
                                  )}
                                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="z-[90] w-auto p-0" align="start">
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
                            {followUpErrors.date ? <p className="mt-1 text-xs text-red-600">{followUpErrors.date}</p> : null}
                          </div>

                          <div className="xl:col-span-4">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Giờ tái khám (24h)</Label>
                            {formState.followUpDate ? (
                              <>
                                {followUpSlotsLoading ? (
                                  <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
                                    Đang tải khung giờ...
                                  </div>
                                ) : followUpSlotViews.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Ngày đang chọn
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {formatDateDisplay(formState.followUpDate)}
                                      </p>
                                    </div>
                                    {!hasAvailableFollowUpSlots ? (
                                      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                        Ngày này hiện không còn khung giờ khả dụng. Vui lòng chọn ngày khác.
                                      </div>
                                    ) : null}
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                      {followUpSlotViews.map((slot) => {
                                        const isSelected = formState.followUpTime === slot.value
                                        return (
                                          <div key={slot.key} className="space-y-1" title={slot.disabledMessage || slot.label}>
                                            <button
                                              type="button"
                                              disabled={slot.disabled}
                                              onClick={() => {
                                                setFormState((prev) => ({ ...prev, followUpTime: slot.value }))
                                                setSubmitError('')
                                                if (followUpErrors.time) {
                                                  setFollowUpErrors((prev) => ({ ...prev, time: undefined }))
                                                }
                                              }}
                                              className={getFollowUpSlotButtonClass(slot.state, isSelected)}
                                            >
                                              {isSelected ? <Check className="absolute right-2 top-2 h-3.5 w-3.5" /> : null}
                                              <span className="w-full text-center">{slot.label}</span>
                                            </button>
                                            {slot.disabledMessage ? (
                                              <p className="px-1 text-[11px] leading-tight text-amber-700">{slot.disabledMessage}</p>
                                            ) : null}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-600">
                                    Không có khung giờ nào được trả về cho ngày này. Vui lòng thử ngày khác.
                                  </div>
                                )}

                                {followUpSlotsError ? (
                                  <p className="mt-2 text-xs text-amber-700">{followUpSlotsError}</p>
                                ) : null}
                              </>
                            ) : (
                              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
                                Chọn ngày trước để hiển thị khung giờ.
                              </div>
                            )}

                            {followUpErrors.time ? <p className="mt-1 text-xs text-red-600">{followUpErrors.time}</p> : null}
                          </div>

                          <div className="xl:col-span-4">
                            <Label className="mb-1.5 block text-xs font-medium text-slate-600">Ghi chú tái khám</Label>
                            <Textarea
                              rows={3}
                              value={formState.followUpNote}
                              onChange={(event) => {
                                setFormState((prev) => ({ ...prev, followUpNote: event.target.value }))
                                setSubmitError('')
                              }}
                              placeholder="Dặn lịch tái khám hoặc lưu ý thêm"
                            />
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <div className="xl:col-span-12">
                      <BillingSummaryPanel
                        isFollowUpAppointment={isCurrentAppointmentFollowUp}
                        consultationFee={consultationFeePreview}
                        consultationFeeApplied={consultationFeeAppliedPreview}
                        medicineTotal={medicinePreviewTotal}
                        serviceTotal={servicePreviewTotal}
                        total={estimatedTotal}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  Không tìm thấy dữ liệu lịch hẹn để hoàn tất khám.
                </div>
              )}

              {submitError ? (
                <div className="mx-auto mt-4 w-full max-w-[1280px] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}
            </div>

            <DialogFooter className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={submitting || !selectedAppointment}
                >
                  Lưu nháp
                </Button>

                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)} disabled={submitting}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedAppointment}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="size-4" />
                        Đang xử lý...
                      </span>
                    ) : (
                      'Xác nhận hoàn tất khám'
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
