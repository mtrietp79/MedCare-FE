import { useEffect, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

    try {
      const data = await doctorMedicalRecordService.getPatientRecords(patientId)
      setPatientDetail({
        patient: data.patient,
        records: Array.isArray(data.records) ? data.records : [],
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
        records: Array.isArray(data.records) ? data.records : [],
      })
    } catch {
      // Keep current detail view if refresh fails.
    }
  }

  const handleCreateFollowUp = async () => {
    if (!followUpRecordId) return
    if (!followUpForm.date || !followUpForm.time) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn ngày và giờ tái khám.',
        variant: 'destructive',
      })
      return
    }

    setFollowUpSubmitting(true)
    try {
      await doctorMedicalRecordService.createFollowUp(followUpRecordId, followUpForm)
      toast({ title: 'Thành công', description: 'Đã tạo lịch tái khám' })
      setFollowUpRecordId(null)
      setFollowUpForm({ date: '', time: '', note: '' })
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
                          }}
                        >
                          Tạo lịch tái khám
                        </Button>
                      </div>

                      {followUpRecordId === record.id && (
                        <div className="space-y-3 rounded-xl border border-[#e5e7eb] bg-slate-50 p-3">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <Label>Ngày tái khám</Label>
                              <Input
                                type="date"
                                value={followUpForm.date}
                                onChange={(event) =>
                                  setFollowUpForm((prev) => ({ ...prev, date: event.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <Label>Giờ tái khám</Label>
                              <Input
                                type="time"
                                value={followUpForm.time}
                                onChange={(event) =>
                                  setFollowUpForm((prev) => ({ ...prev, time: event.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <Label>Ghi chú</Label>
                              <Input
                                value={followUpForm.note}
                                onChange={(event) =>
                                  setFollowUpForm((prev) => ({ ...prev, note: event.target.value }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setFollowUpRecordId(null)}>
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
