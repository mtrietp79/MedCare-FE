import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Eye, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import type { AppointmentSlot, AppointmentSlotResponse } from '@/services/api'
import { doctorAppointmentService } from '@/services/doctorAppointmentService'
import {
  doctorMedicalRecordService,
  type MedicalRecordDetail,
  type MedicalRecordPatient,
} from '@/services/doctorMedicalRecordService'
import { safeString } from '@/lib/admin-normalizers'
import { cn } from '@/lib/utils'
import { getAppointmentTypeLabel as getAppointmentTypeDisplayLabel } from '@/lib/appointment-type'
import {
  getAppointmentStatusClass,
  getAppointmentStatusLabel,
  resolvePaymentStatusView,
} from '@/lib/appointment-status'
import { useToast } from '@/hooks/use-toast'
import { invalidateQueries, onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'

interface PatientDetailState {
  patient?: {
    id?: string
    fullName?: string
    phone?: string
    email?: string
    gender?: string
    dateOfBirth?: string
    address?: string
  }
  records: MedicalRecordDetail[]
}

type DetailRequestState = 'idle' | 'loading' | 'success' | 'error'

interface FollowUpSlotView {
  key: string
  value: string
  label: string
  disabled: boolean
  state: 'available' | 'full' | 'disabled'
  disabledReason?: string
  disabledMessage?: string
}

const SLOT_DISABLED_REASONS = new Set(['PAST', 'LESS_THAN_2H', 'FULL', 'TOO_FAR', 'NO_SCHEDULE', 'SHIFT_UNAVAILABLE'])

interface FollowUpValidationErrors {
  followUpDate?: string
  followUpTime?: string
}

function formatDateDdMmYyyy(value?: string | null): string {
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

function parseDateInput(value?: string | null): Date | null {
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

function formatDateDisplay(value?: string | null): string {
  return formatDateDdMmYyyy(value)
}

function normalizeTimeInput(value?: string | null): string {
  const source = safeString(value).replace(/\./g, ':').replace(/\s+/g, '')
  if (!source) return ''

  const match = source.match(/^(\d{1,2})(?::?(\d{2}))$/)
  if (!match) return ''

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return ''
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractTimeLabelFromDateTime(value?: string | null): string {
  const source = safeString(value)
  if (!source) return ''

  const parsed = new Date(source)
  if (!Number.isNaN(parsed.getTime())) {
    const hour = String(parsed.getHours()).padStart(2, '0')
    const minute = String(parsed.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }

  const match = source.match(/(\d{1,2}):(\d{2})/)
  if (!match) return ''
  return `${String(Number(match[1])).padStart(2, '0')}:${String(Number(match[2])).padStart(2, '0')}`
}

function getBackendErrorMessage(error: any, fallbackMessage: string): string {
  const backendMessage = safeString(error?.response?.data?.message)
  if (backendMessage) return backendMessage

  const directMessage = safeString(error?.message)
  if (directMessage) return directMessage

  return fallbackMessage
}

function formatCurrencyVnd(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function formatDateTimeDisplay(dateTime?: string | null, date?: string | null, time?: string | null): string {
  const normalizedDate = formatDateDisplay(date)
  const normalizedTime = normalizeTimeInput(time)

  if (normalizedDate !== '-') {
    return normalizedTime ? `${normalizedDate}, lúc ${normalizedTime}` : normalizedDate
  }

  const source = safeString(dateTime)
  if (!source) return '-'

  const parsed = new Date(source)
  if (!Number.isNaN(parsed.getTime())) {
    return `${formatDateDisplay(source)}, lúc ${extractTimeLabelFromDateTime(source)}`
  }

  return source
}

function getRecordTypeLabel(record: MedicalRecordDetail): string {
  return getAppointmentTypeDisplayLabel({
    type: record.appointmentType,
    appointmentType: record.appointmentType,
    typeCode: record.typeCode,
    appointmentTypeCode: record.appointmentTypeCode,
  })
}

function getMedicalRecordId(record: MedicalRecordDetail): string {
  return safeString(record.recordId) || safeString(record.id) || ''
}

function getFollowUpFieldErrors(error: any): FollowUpValidationErrors {
  const fieldErrors = error?.response?.data?.fieldErrors
  return {
    followUpDate: safeString(fieldErrors?.followUpDate) || undefined,
    followUpTime: safeString(fieldErrors?.followUpTime) || undefined,
  }
}

function hasFollowUpFieldErrors(errors: FollowUpValidationErrors): boolean {
  return Boolean(errors.followUpDate || errors.followUpTime)
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
    selected && 'border-teal-700 bg-teal-100 text-teal-950 shadow-sm',
    !selected && slotState === 'available' && 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900',
    !selected && slotState === 'full' && 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700',
    !selected && slotState === 'disabled' && 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
  )
}

function getRecordSortTimestamp(record: MedicalRecordDetail): number {
  return (
    parseDateInput(record.visitDate)?.getTime() ??
    parseDateInput(record.recordCreatedAt || record.createdAt)?.getTime() ??
    0
  )
}

function sortMedicalRecords(records: MedicalRecordDetail[]): MedicalRecordDetail[] {
  return [...records].sort((left, right) => getRecordSortTimestamp(right) - getRecordSortTimestamp(left))
}

export function DoctorMedicalRecordsPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState({ totalPatients: 0, newPatients: 0, followUpPatients: 0 })
  const [patients, setPatients] = useState<MedicalRecordPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStatus, setDetailStatus] = useState<DetailRequestState>('idle')
  const [detailError, setDetailError] = useState('')
  const [patientDetail, setPatientDetail] = useState<PatientDetailState>({ records: [] })
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [followUpRecordId, setFollowUpRecordId] = useState<string | null>(null)
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ date: '', time: '', note: '' })
  const [followUpErrors, setFollowUpErrors] = useState<FollowUpValidationErrors>({})
  const [followUpSubmitError, setFollowUpSubmitError] = useState('')
  const [isFollowUpDatePickerOpen, setIsFollowUpDatePickerOpen] = useState(false)
  const [followUpSlots, setFollowUpSlots] = useState<AppointmentSlotResponse[]>([])
  const [followUpSlotsLoading, setFollowUpSlotsLoading] = useState(false)
  const [followUpSlotsError, setFollowUpSlotsError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const todayDateOnly = toDateOnly(new Date())
  const selectedFollowUpRecord = useMemo(
    () => patientDetail.records.find((record) => getMedicalRecordId(record) === followUpRecordId) ?? null,
    [followUpRecordId, patientDetail.records]
  )

  const minAllowedDateTime = useMemo(() => new Date(currentTime.getTime() + 60 * 60 * 1000), [currentTime])
  const followUpSlotViews = useMemo<FollowUpSlotView[]>(() => {
    const selectedDateKey = followUpForm.date || formatDateAsIso(todayDateOnly)

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
  }, [followUpForm.date, followUpSlots, todayDateOnly])

  const hasAvailableFollowUpSlots = useMemo(
    () => followUpSlotViews.some((slot) => slot.state === 'available'),
    [followUpSlotViews]
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selectedFollowUpRecord) {
      setFollowUpSlots([])
      setFollowUpSlotsLoading(false)
      setFollowUpSlotsError('')
      return
    }

    if (!followUpForm.date) {
      setFollowUpSlots([])
      setFollowUpSlotsLoading(false)
      setFollowUpSlotsError('')
      return
    }

    let active = true

    const loadFollowUpSlots = async () => {
      try {
        setFollowUpSlotsLoading(true)
        setFollowUpSlotsError('')
        const slotsResult = await doctorAppointmentService.getFollowUpSlots(followUpForm.date)
        if (!active) return
        setFollowUpSlots(Array.isArray(slotsResult) ? slotsResult : [])
      } catch (error: any) {
        if (!active) return
        setFollowUpSlots([])
        setFollowUpSlotsError(getBackendErrorMessage(error, 'Không thể tải khung giờ tái khám khả dụng.'))
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
  }, [followUpForm.date, selectedFollowUpRecord])

  useEffect(() => {
    if (!followUpForm.time) return
    const selected = followUpSlotViews.find((slot) => slot.value === followUpForm.time)
    if (!selected || selected.disabled) {
      setFollowUpForm((prev) => ({ ...prev, time: '' }))
    }
  }, [followUpForm.time, followUpSlotViews])

  const resetFollowUpAsyncState = () => {
    setFollowUpSlots([])
    setFollowUpSlotsError('')
  }

  const resetFollowUpDraft = (nextRecordId: string | null = null) => {
    setFollowUpRecordId(nextRecordId)
    setFollowUpForm({ date: '', time: '', note: '' })
    setFollowUpErrors({})
    setFollowUpSubmitError('')
    setIsFollowUpDatePickerOpen(false)
    resetFollowUpAsyncState()
  }

  const fetchSummary = async () => {
    const data = await doctorMedicalRecordService.getSummary()
    setSummary({
      totalPatients: Number(data.totalPatients ?? 0),
      newPatients: Number(data.newPatients ?? 0),
      followUpPatients: Number(data.followUpPatients ?? 0),
    })
  }

  const fetchPatients = async (searchKeyword: string) => {
    const data = await doctorMedicalRecordService.getPatients(searchKeyword)
    setPatients(Array.isArray(data) ? data : [])
  }

  const loadPageData = async (searchKeyword: string) => {
    setLoading(true)
    setError('')

    try {
      const [summaryData, tablePatients] = await Promise.all([
        doctorMedicalRecordService.getSummary(),
        doctorMedicalRecordService.getPatients(searchKeyword),
      ])

      setSummary({
        totalPatients: Number(summaryData.totalPatients ?? 0),
        newPatients: Number(summaryData.newPatients ?? 0),
        followUpPatients: Number(summaryData.followUpPatients ?? 0),
      })
      setPatients(Array.isArray(tablePatients) ? tablePatients : [])
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải dữ liệu bệnh án.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData(keyword)
  }, [keyword])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setKeyword(keywordInput.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [keywordInput])

  useEffect(() => {
    return onQueryInvalidation((payload) => {
      if (payload.keys.includes(QUERY_KEYS.doctorMedicalRecordSummary)) {
        void fetchSummary()
      }

      if (payload.keys.includes(QUERY_KEYS.doctorMedicalRecordPatients)) {
        void fetchPatients(keyword)
      }

      if (
        detailOpen &&
        selectedPatientId &&
        (payload.keys.includes(QUERY_KEYS.doctorMedicalRecordPatients) ||
          payload.keys.includes(QUERY_KEYS.patientMedicalRecordByAppointment))
      ) {
        void refreshPatientDetail(selectedPatientId)
      }
    })
  }, [detailOpen, keyword, selectedPatientId])

  const loadPatientDetail = async (patientId: string): Promise<boolean> => {
    setDetailStatus('loading')
    setDetailError('')

    try {
      const data = await doctorMedicalRecordService.getPatientRecords(patientId)
      setPatientDetail({
        patient: data.patient,
        records: sortMedicalRecords(data.records ?? []),
      })
      setDetailStatus('success')
      return true
    } catch (fetchError: any) {
      setDetailStatus('error')
      setDetailError(getBackendErrorMessage(fetchError, 'Khong tai duoc ho so benh an'))
      return false
    }
  }

  const openPatientDetail = async (patientId: string) => {
    setDetailOpen(true)
    setSelectedPatientId(patientId)
    resetFollowUpDraft()
    await loadPatientDetail(patientId)
  }

  const refreshPatientDetail = async (patientId: string): Promise<boolean> => {
    return loadPatientDetail(patientId)
  }

  const handleCreateFollowUp = async () => {
    const recordId = safeString(selectedFollowUpRecord?.recordId) || safeString(followUpRecordId)
    if (!recordId) return
    const normalizedDate = parseDateInput(followUpForm.date)
    const normalizedTime = normalizeTimeInput(followUpForm.time)
    const nextErrors: FollowUpValidationErrors = {}

    if (!followUpForm.date || !normalizedDate) {
      nextErrors.followUpDate = 'Vui lòng chọn ngày tái khám.'
    } else if (toDateOnly(normalizedDate).getTime() < todayDateOnly.getTime()) {
      nextErrors.followUpDate = 'Ngày tái khám phải từ hôm nay trở đi.'
    }

    if (!followUpForm.time) {
      nextErrors.followUpTime = 'Vui lòng chọn giờ tái khám.'
    } else if (!normalizedTime) {
      nextErrors.followUpTime = 'Vui lòng nhập giờ tái khám theo định dạng 24h, ví dụ 08:30 hoặc 14:30.'
    }

    setFollowUpErrors(nextErrors)
    setFollowUpSubmitError('')
    if (hasFollowUpFieldErrors(nextErrors)) return

    setFollowUpSubmitting(true)
    try {
      await doctorMedicalRecordService.createFollowUp(recordId, {
        followUpDate: formatDateAsIso(toDateOnly(normalizedDate as Date)),
        followUpTime: normalizedTime,
        note: safeString(followUpForm.note) || undefined,
      })
      await Promise.allSettled([
        selectedPatientId ? refreshPatientDetail(selectedPatientId) : Promise.resolve(true),
        fetchSummary(),
        fetchPatients(keyword),
      ])
      invalidateQueries({
        keys: [
          QUERY_KEYS.doctorMedicalRecordSummary,
          QUERY_KEYS.doctorMedicalRecordPatients,
          QUERY_KEYS.patientMedicalRecordByAppointment,
        ],
      })
        resetFollowUpDraft()
        toast({ title: 'Thành công', description: 'Đã tạo lịch tái khám' })
      } catch (submitError: any) {
        const status = Number(submitError?.response?.status)
        const fieldErrors = getFollowUpFieldErrors(submitError)
        const backendMessage = safeString(submitError?.response?.data?.message)

        if (status === 400) {
          setFollowUpErrors(fieldErrors)
          setFollowUpSubmitError(hasFollowUpFieldErrors(fieldErrors) ? '' : backendMessage || 'Vui lòng kiểm tra lại thông tin lịch tái khám.')
        } else {
          setFollowUpErrors({})
          const fallbackMessage =
            status >= 500
              ? 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
              : 'Không thể tạo lịch tái khám.'
          toast({
            title: 'Lỗi',
            description: getBackendErrorMessage(submitError, fallbackMessage),
            variant: 'destructive',
          })
          setFollowUpSubmitError(getBackendErrorMessage(submitError, fallbackMessage))
        }
      } finally {
        setFollowUpSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Bệnh án</h1>
        <p className="text-[#6b7280]">Quản lý hồ sơ bệnh nhân của bạn</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
        <Input
          placeholder="Tìm kiếm theo tên, SĐT, hoặc email..."
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          className="h-12 rounded-xl border-[#e5e7eb] pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b7280]">Tổng bệnh nhân</p>
            <p className="mt-2 text-3xl font-bold text-[#111827]">{summary.totalPatients}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b7280]">Bệnh nhân mới</p>
            <p className="mt-2 text-3xl font-bold text-[#111827]">{summary.newPatients}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-[#6b7280]">Bệnh nhân tái khám</p>
            <p className="mt-2 text-3xl font-bold text-[#111827]">{summary.followUpPatients}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadPageData(keyword)} />}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên bệnh nhân</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Lần tái khám / Số lần khám</TableHead>
                  <TableHead>Khám gần nhất</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{safeString(patient.fullName) || '-'}</TableCell>
                    <TableCell>{safeString(patient.phone) || '-'}</TableCell>
                    <TableCell>{safeString(patient.email) || '-'}</TableCell>
                    <TableCell>{safeString(patient.gender) || '-'}</TableCell>
                    <TableCell>
                      {Number(patient.followUpCount ?? 0)} / {Number(patient.newExamCount ?? 0)}
                    </TableCell>
                    <TableCell>{formatDateDdMmYyyy(patient.latestVisitDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => void openPatientDetail(patient.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-[#6b7280]">
                      Không có bệnh nhân phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setSelectedPatientId(null)
            setDetailStatus('idle')
            setDetailError('')
            resetFollowUpDraft()
          }
        }}
      >
        <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hồ sơ bệnh án bệnh nhân</DialogTitle>
            <DialogDescription>Thông tin bệnh nhân và lịch sử khám</DialogDescription>
          </DialogHeader>

          {detailStatus === 'loading' ? (
            <AdminTableSkeleton rows={5} />
          ) : detailStatus === 'error' ? (
            <AdminErrorState
              message={detailError || 'Khong tai duoc ho so benh an'}
              onRetry={() => {
                if (selectedPatientId) {
                  void loadPatientDetail(selectedPatientId)
                }
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-xl border border-[#e5e7eb] bg-slate-50 p-4 md:grid-cols-2">
                <div><span className="font-semibold">Họ tên:</span> {safeString(patientDetail.patient?.fullName) || '-'}</div>
                <div><span className="font-semibold">SĐT:</span> {safeString(patientDetail.patient?.phone) || '-'}</div>
                <div><span className="font-semibold">Email:</span> {safeString(patientDetail.patient?.email) || '-'}</div>
                <div><span className="font-semibold">Giới tính:</span> {safeString(patientDetail.patient?.gender) || '-'}</div>
                <div><span className="font-semibold">Ngày sinh:</span> {formatDateDdMmYyyy(patientDetail.patient?.dateOfBirth)}</div>
                <div><span className="font-semibold">Địa chỉ:</span> {safeString(patientDetail.patient?.address) || '-'}</div>
              </div>

              <div className="space-y-4">
                {patientDetail.records.map((record) => {
                  const hasFollowUpAppointment = Boolean(record.followUpAppointment)
                  const hasFollowUpLink = Boolean(record.followUpAppointmentId)
                  const followUpAppointment = record.followUpAppointment
                  const followUpPaymentView = resolvePaymentStatusView(followUpAppointment?.paymentStatus)
                  const followUpTypeLabel = followUpAppointment
                    ? getAppointmentTypeDisplayLabel({
                        type: followUpAppointment.type,
                        appointmentType: followUpAppointment.type,
                        typeCode: followUpAppointment.typeCode,
                        appointmentTypeCode: followUpAppointment.appointmentTypeCode,
                      })
                    : 'Tái khám'

                  return (
                    <Card key={record.id} className="rounded-xl border border-[#e5e7eb]">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[#111827]">
                            Ngày khám: {formatDateDdMmYyyy(record.visitDate)}
                          </div>
                          <Badge className="rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                            {getRecordTypeLabel(record)}
                          </Badge>
                        </div>
                        <div className="text-sm text-[#6b7280]">
                          Ngày tạo hồ sơ: {formatDateDdMmYyyy(record.recordCreatedAt || record.createdAt)}
                        </div>

                        <div><span className="font-semibold">Triệu chứng:</span> {safeString(record.symptoms) || '-'}</div>
                        <div><span className="font-semibold">Chẩn đoán:</span> {safeString(record.diagnosis) || '-'}</div>
                        <div><span className="font-semibold">Lời dặn bác sĩ:</span> {safeString(record.advice) || '-'}</div>

                        <div>
                          <p className="font-semibold">Thuốc đã kê:</p>
                          <ul className="ml-5 list-disc text-sm text-[#374151]">
                            {(record.medicines ?? []).map((medicine, index) => (
                              <li key={index}>
                                {safeString(medicine.medicineName) || '-'}
                                {medicine.quantity ? ` - ${medicine.quantity}` : ''}
                                {safeString(medicine.dosage) ? ` - ${safeString(medicine.dosage)}` : ''}
                                {safeString(medicine.note) ? ` (${safeString(medicine.note)})` : ''}
                              </li>
                            ))}
                            {(record.medicines ?? []).length === 0 && <li>-</li>}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold">Dịch vụ y tế đã sử dụng:</p>
                          <ul className="ml-5 list-disc text-sm text-[#374151]">
                            {(record.medicalServices ?? []).map((service, index) => (
                              <li key={index}>
                                {safeString(service.serviceName) || '-'}
                                {safeString(service.note) ? ` (${safeString(service.note)})` : ''}
                              </li>
                            ))}
                            {(record.medicalServices ?? []).length === 0 && <li>-</li>}
                          </ul>
                        </div>

                      {hasFollowUpAppointment ? (
                        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-teal-950">Lịch tái khám đã tạo</p>
                              <p className="text-xs text-teal-800">
                                Hồ sơ này đã có lịch tái khám liên kết theo contract mới.
                              </p>
                            </div>
                            {followUpAppointment ? (
                              <Badge
                                className={`rounded-full border ${getAppointmentStatusClass(
                                  followUpAppointment.status,
                                  followUpAppointment.statusDisplay
                                )}`}
                              >
                                {getAppointmentStatusLabel(
                                  followUpAppointment.status,
                                  followUpAppointment.statusDisplay
                                )}
                              </Badge>
                            ) : null}
                          </div>

                          {followUpAppointment ? (
                            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <div><span className="font-semibold">Mã lịch:</span> {safeString(followUpAppointment.appointmentCode) || safeString(followUpAppointment.appointmentId) || '-'}</div>
                              <div><span className="font-semibold">Thời gian:</span> {formatDateTimeDisplay(followUpAppointment.appointmentDateTime, followUpAppointment.appointmentDate, followUpAppointment.appointmentTime)}</div>
                              <div><span className="font-semibold">Loại khám:</span> {followUpTypeLabel}</div>
                              <div><span className="font-semibold">Lich goc:</span> {safeString(followUpAppointment.parentAppointmentId) || '-'}</div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Thanh toán:</span>
                                <Badge className={cn('rounded-full border', followUpPaymentView.className)}>
                                  {followUpPaymentView.label}
                                </Badge>
                              </div>
                              <div><span className="font-semibold">Phí khám:</span> {formatCurrencyVnd(followUpAppointment.consultationFee)}</div>
                              <div className="md:col-span-2"><span className="font-semibold">Ghi chú:</span> {safeString(followUpAppointment.note) || '-'}</div>
                            </div>
                          ) : null}
                        </div>
                      ) : hasFollowUpLink ? (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                          >
                            Da co lich tai kham
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetFollowUpDraft(getMedicalRecordId(record))}
                            disabled={followUpSubmitting}
                          >
                            Tạo lịch tái khám
                          </Button>
                        </div>
                      )}

                      {!hasFollowUpLink && !hasFollowUpAppointment && followUpRecordId === getMedicalRecordId(record) && (
                        <div className="space-y-4 rounded-xl border border-[#e5e7eb] bg-slate-50 p-4">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">Tạo lịch tái khám</p>
                            <p className="text-xs text-[#6b7280]">
                              Chọn ngày và khung giờ còn trống để tạo lịch tái khám cho bệnh nhân.
                            </p>
                          </div>

                          <div className="grid gap-3 xl:grid-cols-12">
                            <div className="xl:col-span-4">
                              <Label className="mb-1.5 block">Ngày tái khám</Label>
                              <Popover open={isFollowUpDatePickerOpen} onOpenChange={setIsFollowUpDatePickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" className="h-10 w-full justify-between font-normal">
                                    {followUpForm.date ? (
                                      <span>{formatDateDisplay(followUpForm.date)}</span>
                                    ) : (
                                      <span className="text-muted-foreground">Chọn ngày tái khám</span>
                                    )}
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="z-[90] w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={parseDateInput(followUpForm.date) ?? undefined}
                                    onSelect={(date) => {
                                      if (!date) return
                                      const normalizedDate = toDateOnly(date)
                                      if (normalizedDate < todayDateOnly) return

                                      setFollowUpForm((prev) => ({
                                        ...prev,
                                        date: formatDateAsIso(normalizedDate),
                                        time: '',
                                      }))
                                      setFollowUpErrors({})
                                      setFollowUpSubmitError('')
                                      setIsFollowUpDatePickerOpen(false)
                                    }}
                                    disabled={(date) => toDateOnly(date) < todayDateOnly}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              {followUpErrors.followUpDate ? (
                                <p className="mt-1 text-xs text-red-600">{followUpErrors.followUpDate}</p>
                              ) : (
                                <p className="mt-1 text-xs text-[#6b7280]">Chỉ chọn từ hôm nay trở đi.</p>
                              )}
                            </div>

                            <div className="xl:col-span-4">
                              <Label className="mb-1.5 block">Giờ tái khám</Label>
                              {!followUpForm.date ? (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                  Chọn ngày trước để hiển thị khung giờ khả dụng.
                                </div>
                              ) : followUpSlotsLoading ? (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                                  Đang tải khung giờ tái khám...
                                </div>
                              ) : followUpSlotViews.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      Ngày đang chọn
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      {formatDateDisplay(followUpForm.date)}
                                    </p>
                                  </div>
                                  {!hasAvailableFollowUpSlots ? (
                                    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                      Ngày này hiện không còn khung giờ khả dụng. Vui lòng chọn ngày khác.
                                    </div>
                                  ) : null}
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {followUpSlotViews.map((slot) => {
                                      const isSelected = followUpForm.time === slot.value
                                      return (
                                        <div key={slot.key} className="space-y-1" title={slot.disabledMessage || slot.label}>
                                          <button
                                            type="button"
                                            disabled={slot.disabled}
                                            onClick={() => {
                                              setFollowUpForm((prev) => ({ ...prev, time: slot.value }))
                                              setFollowUpErrors((prev) => ({ ...prev, followUpTime: undefined }))
                                              setFollowUpSubmitError('')
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
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                                  Không có khung giờ nào được trả về cho ngày này. Vui lòng thử ngày khác.
                                </div>
                              )}
                              <input type="hidden" value={followUpForm.time} />
                              {followUpSlotsError ? (
                                <p className="mt-1 text-xs text-amber-700">{followUpSlotsError}</p>
                              ) : (
                                <p className="mt-1 text-xs text-[#6b7280]">
                                  Chọn khung giờ còn trống theo lịch làm việc của bác sĩ.
                                </p>
                              )}
                              {followUpErrors.followUpTime ? (
                                <p className="mt-1 text-xs text-red-600">{followUpErrors.followUpTime}</p>
                              ) : null}
                            </div>

                            <div className="xl:col-span-4">
                              <Label className="mb-1.5 block">Ghi chú tái khám</Label>
                              <Textarea
                                value={followUpForm.note}
                                rows={3}
                                placeholder="Ghi chú thêm cho lần tái khám (nếu có)"
                                onChange={(event) => {
                                  setFollowUpForm((prev) => ({ ...prev, note: event.target.value }))
                                  setFollowUpSubmitError('')
                                }}
                              />
                            </div>
                          </div>

                          {(followUpForm.date || followUpForm.time) && (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                              <span className="font-medium text-slate-800">Lịch tái khám dự kiến:</span>{' '}
                              {followUpForm.date ? formatDateDisplay(followUpForm.date) : 'Chưa chọn ngày'}
                              {normalizeTimeInput(followUpForm.time) ? `, lúc ${normalizeTimeInput(followUpForm.time)}` : ''}
                            </div>
                          )}

                          {followUpSubmitError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                              {followUpSubmitError}
                            </div>
                          ) : null}

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => resetFollowUpDraft()}
                            >
                              Hủy
                            </Button>
                            <Button onClick={() => void handleCreateFollowUp()} disabled={followUpSubmitting}>
                              {followUpSubmitting ? 'Đang tạo...' : 'Xác nhận'}
                            </Button>
                          </div>
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  )
                })}

                {patientDetail.records.length === 0 && (
                  <Card className="rounded-xl border border-[#e5e7eb]">
                    <CardContent className="py-8 text-center text-[#6b7280]">
                      Bệnh nhân chưa có bệnh án.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
