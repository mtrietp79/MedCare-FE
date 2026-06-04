import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Eye, Search } from 'lucide-react'
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
import {
  doctorMedicalRecordService,
  type MedicalRecordDetail,
  type MedicalRecordPatient,
} from '@/services/doctorMedicalRecordService'
import { safeString } from '@/lib/admin-normalizers'
import { useToast } from '@/hooks/use-toast'
import { onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'

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

function normalizeTypeLabel(value?: string): string {
  const type = safeString(value).toLowerCase()
  if (type.includes('tai') || type.includes('follow') || type.includes('revisit')) return 'Tái khám'
  return 'Khám bệnh'
}

export function DoctorMedicalRecordsPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState({ totalPatients: 0, newPatients: 0, revisitPatients: 0 })
  const [patients, setPatients] = useState<MedicalRecordPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [patientDetail, setPatientDetail] = useState<PatientDetailState>({ records: [] })
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [followUpRecordId, setFollowUpRecordId] = useState<string | null>(null)
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ date: '', time: '', note: '' })
  const [isFollowUpDatePickerOpen, setIsFollowUpDatePickerOpen] = useState(false)
  const todayDateOnly = toDateOnly(new Date())

  const fetchSummary = async () => {
    const data = await doctorMedicalRecordService.getSummary()
    setSummary({
      totalPatients: Number(data.totalPatients ?? 0),
      newPatients: Number(data.newPatients ?? 0),
      revisitPatients: Number(data.revisitPatients ?? 0),
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
      await Promise.all([fetchSummary(), fetchPatients(searchKeyword)])
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

  const openPatientDetail = async (patientId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedPatientId(patientId)
    setFollowUpRecordId(null)
    setFollowUpForm({ date: '', time: '', note: '' })
    setIsFollowUpDatePickerOpen(false)

    try {
      const data = await doctorMedicalRecordService.getPatientRecords(patientId)
      setPatientDetail({
        patient: data.patient,
        records: sortMedicalRecords(Array.isArray(data.records) ? data.records : []),
      })
    } catch (fetchError: any) {
      toast({
        title: 'Lỗi',
        description: fetchError?.message || 'Không thể tải chi tiết bệnh án.',
        variant: 'destructive',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshPatientDetail = async (patientId: string) => {
    try {
      const data = await doctorMedicalRecordService.getPatientRecords(patientId)
      setPatientDetail({
        patient: data.patient,
        records: sortMedicalRecords(Array.isArray(data.records) ? data.records : []),
      })
    } catch {
      // Keep current detail view if refresh fails.
    }
  }

  const handleCreateFollowUp = async () => {
    if (!followUpRecordId) return
    const normalizedDate = parseDateInput(followUpForm.date)
    const normalizedTime = normalizeTimeInput(followUpForm.time)

    if (!normalizedDate || !followUpForm.time) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn ngày và giờ tái khám.',
        variant: 'destructive',
      })
      return
    }

    if (toDateOnly(normalizedDate).getTime() < todayDateOnly.getTime()) {
      toast({
        title: 'Ngày không hợp lệ',
        description: 'Ngày tái khám phải từ hôm nay trở đi.',
        variant: 'destructive',
      })
      return
    }

    if (!normalizedTime) {
      toast({
        title: 'Giờ không hợp lệ',
        description: 'Vui lòng nhập giờ tái khám theo định dạng 24h, ví dụ 08:30 hoặc 14:30.',
        variant: 'destructive',
      })
      return
    }

    setFollowUpSubmitting(true)
    try {
      await doctorMedicalRecordService.createFollowUp(followUpRecordId, {
        date: formatDateAsIso(toDateOnly(normalizedDate)),
        time: normalizedTime,
        note: safeString(followUpForm.note) || undefined,
      })
      toast({ title: 'Thành công', description: 'Đã tạo lịch tái khám' })
      setFollowUpRecordId(null)
      setFollowUpForm({ date: '', time: '', note: '' })
      setIsFollowUpDatePickerOpen(false)
    } catch (submitError: any) {
      toast({
        title: 'Lỗi',
        description: submitError?.message || 'Không thể tạo lịch tái khám.',
        variant: 'destructive',
      })
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
            <p className="mt-2 text-3xl font-bold text-[#111827]">{summary.revisitPatients}</p>
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
                      {Number(patient.revisitCount ?? 0)} / {Number(patient.totalVisits ?? 0)}
                    </TableCell>
                    <TableCell>{formatDateDdMmYyyy(patient.lastVisitDate)}</TableCell>
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
            setFollowUpRecordId(null)
            setFollowUpForm({ date: '', time: '', note: '' })
            setIsFollowUpDatePickerOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hồ sơ bệnh án bệnh nhân</DialogTitle>
            <DialogDescription>Thông tin bệnh nhân và lịch sử khám</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <AdminTableSkeleton rows={5} />
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
                {patientDetail.records.map((record) => (
                  <Card key={record.id} className="rounded-xl border border-[#e5e7eb]">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-[#111827]">
                          Ngày khám: {formatDateDdMmYyyy(record.visitDate)}
                        </div>
                        <Badge className="rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                          {normalizeTypeLabel(record.appointmentType)}
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

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFollowUpRecordId(record.id)
                            setFollowUpForm({ date: '', time: '', note: '' })
                            setIsFollowUpDatePickerOpen(false)
                          }}
                        >
                          Tạo lịch tái khám
                        </Button>
                      </div>

                      {followUpRecordId === record.id && (
                        <div className="space-y-4 rounded-xl border border-[#e5e7eb] bg-slate-50 p-4">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">Tạo lịch tái khám</p>
                            <p className="text-xs text-[#6b7280]">
                              Chọn ngày tái khám và nhập giờ theo định dạng 24h để bệnh nhân dễ theo dõi.
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
                                      }))
                                      setIsFollowUpDatePickerOpen(false)
                                    }}
                                    disabled={(date) => toDateOnly(date) < todayDateOnly}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="mt-1 text-xs text-[#6b7280]">Chỉ chọn từ hôm nay trở đi.</p>
                            </div>

                            <div className="xl:col-span-3">
                              <Label className="mb-1.5 block">Giờ tái khám (24h)</Label>
                              <div className="relative">
                                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                                <Input
                                  value={followUpForm.time}
                                  inputMode="numeric"
                                  maxLength={5}
                                  placeholder="VD: 14:30"
                                  className="pl-9"
                                  onChange={(event) =>
                                    setFollowUpForm((prev) => ({
                                      ...prev,
                                      time: event.target.value.replace(/[^\d:]/g, '').slice(0, 5),
                                    }))
                                  }
                                  onBlur={() => {
                                    const normalizedTime = normalizeTimeInput(followUpForm.time)
                                    if (!normalizedTime) return
                                    setFollowUpForm((prev) => ({ ...prev, time: normalizedTime }))
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-[#6b7280]">Ví dụ: 08:30 hoặc 14:30.</p>
                            </div>

                            <div className="xl:col-span-5">
                              <Label className="mb-1.5 block">Ghi chú</Label>
                              <Textarea
                                value={followUpForm.note}
                                rows={3}
                                placeholder="Ghi chú thêm cho lần tái khám (nếu có)"
                                onChange={(event) =>
                                  setFollowUpForm((prev) => ({ ...prev, note: event.target.value }))
                                }
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

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFollowUpRecordId(null)
                                setFollowUpForm({ date: '', time: '', note: '' })
                                setIsFollowUpDatePickerOpen(false)
                              }}
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
                ))}

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
