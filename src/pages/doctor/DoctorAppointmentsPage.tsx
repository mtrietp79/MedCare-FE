import { useEffect, useMemo, useState } from 'react'
import { Eye, FilePenLine, Pill, Stethoscope, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  type DoctorAppointment,
  type DoctorMedicalService,
  type DoctorMedicine,
} from '@/services/doctorAppointmentService'
import { safeString } from '@/lib/admin-normalizers'
import { useToast } from '@/hooks/use-toast'

interface PrescriptionItemForm {
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

const initialCompleteForm: CompleteFormState = {
  symptoms: '',
  diagnosis: '',
  advice: '',
  medicines: [{ medicineId: '', quantity: '1', dosage: '', note: '' }],
  medicalServices: [],
  followUpEnabled: false,
  followUpDate: '',
  followUpTime: '',
  followUpNote: '',
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
  if (key === 'pending') return 'Chờ khám'
  if (key === 'completed') return 'Đã khám'
  return 'Hủy lịch'
}

function getStatusBadgeClass(rawStatus: string): string {
  const key = normalizeStatus(rawStatus)
  if (key === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (key === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

function getAppointmentTypeLabel(rawType: string): string {
  const type = normalizeText(rawType)
  if (type.includes('tai') || type.includes('follow') || type.includes('revisit')) return 'Tái khám'
  return 'Khám bệnh'
}

function getPatientName(appointment: DoctorAppointment): string {
  return safeString(appointment.patientName) || safeString(appointment.patient?.fullName) || '-'
}

function isServicePackageBooking(appointment: DoctorAppointment): boolean {
  const typeText = normalizeText(safeString((appointment as any).type))
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
  return formatDateDdMmYyyy(safeString(appointment.date) || safeString(appointment.appointmentDate))
}

function getTimeLabel(appointment: DoctorAppointment): string {
  return safeString(appointment.appointmentTimeLabel) || safeString(appointment.time) || '--:--'
}

export function DoctorAppointmentsPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [medicines, setMedicines] = useState<DoctorMedicine[]>([])
  const [medicalServices, setMedicalServices] = useState<DoctorMedicalService[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [formState, setFormState] = useState<CompleteFormState>(initialCompleteForm)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const appointmentsResult = await doctorAppointmentService.getAppointments()
      const normalizedAppointments = Array.isArray(appointmentsResult) ? appointmentsResult : []
      setAppointments(normalizedAppointments.filter((item) => !isServicePackageBooking(item)))

      const [medicinesResult, servicesResult] = await Promise.allSettled([
        doctorAppointmentService.getMedicines(),
        doctorAppointmentService.getMedicalServices(),
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

  const availableMedicines = useMemo(
    () =>
      medicines.filter((medicine) => {
        const status = normalizeText(safeString(medicine.status))
        return !status.includes('het hang') && !status.includes('out_of_stock')
      }),
    [medicines]
  )

  const filteredAppointments = useMemo(() => {
    const keywordLower = normalizeText(keyword)
    if (!keywordLower) return appointments

    return appointments.filter((appointment) => {
      const patient = normalizeText(getPatientName(appointment))
      const date = normalizeText(getDateLabel(appointment))
      const type = normalizeText(getAppointmentTypeLabel(safeString(appointment.type)))
      const status = normalizeText(getStatusLabel(safeString(appointment.status)))
      return [patient, date, type, status].some((value) => value.includes(keywordLower))
    })
  }, [appointments, keyword])

  const openDetail = async (appointment: DoctorAppointment) => {
    try {
      const detail = await doctorAppointmentService.getAppointmentById(String(appointment.id))
      setSelectedAppointment(detail ?? appointment)
    } catch {
      setSelectedAppointment(appointment)
    }
    setDetailOpen(true)
  }

  const openComplete = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment)
    setFormState(initialCompleteForm)
    setCompleteOpen(true)
  }

  const handleAddMedicineRow = () => {
    setFormState((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { medicineId: '', quantity: '1', dosage: '', note: '' }],
    }))
  }

  const handleRemoveMedicineRow = (index: number) => {
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

  const handleServiceToggle = (serviceId: string) => {
    setFormState((prev) => {
      const exists = prev.medicalServices.some((service) => service.serviceId === serviceId)
      if (exists) {
        return {
          ...prev,
          medicalServices: prev.medicalServices.filter((service) => service.serviceId !== serviceId),
        }
      }
      return {
        ...prev,
        medicalServices: [...prev.medicalServices, { serviceId, note: '' }],
      }
    })
  }

  const handleServiceNoteChange = (serviceId: string, note: string) => {
    setFormState((prev) => ({
      ...prev,
      medicalServices: prev.medicalServices.map((service) =>
        service.serviceId === serviceId ? { ...service, note } : service
      ),
    }))
  }

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment?.id) return

    const payload: CompleteAppointmentPayload = {
      symptoms: formState.symptoms.trim(),
      diagnosis: formState.diagnosis.trim(),
      advice: formState.advice.trim(),
      medicines: formState.medicines
        .filter((item) => item.medicineId && Number(item.quantity) > 0)
        .map((item) => ({
          medicineId: item.medicineId,
          quantity: Number(item.quantity),
          dosage: item.dosage.trim(),
          note: item.note.trim() || undefined,
        })),
      medicalServices: formState.medicalServices.map((service) => ({
        serviceId: service.serviceId,
        note: service.note.trim() || undefined,
      })),
      followUp: formState.followUpEnabled
        ? {
            enabled: true,
            date: formState.followUpDate || undefined,
            time: formState.followUpTime || undefined,
            note: formState.followUpNote.trim() || undefined,
            type: 'Tái khám',
          }
        : { enabled: false },
    }

    setSubmitting(true)
    try {
      await doctorAppointmentService.completeAppointment(String(selectedAppointment.id), payload)
      toast({ title: 'Thành công', description: 'Đã hoàn tất lịch khám.' })
      setCompleteOpen(false)
      setFormState(initialCompleteForm)
      await loadData()
    } catch (submitError: any) {
      toast({
        title: 'Lỗi',
        description: submitError?.message || 'Không thể hoàn tất lịch khám.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

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

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadData()} />}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Ngày giờ</TableHead>
                  <TableHead>Loại khám</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const statusLabel = getStatusLabel(safeString(appointment.status))
                  const statusKey = normalizeStatus(safeString(appointment.status))
                  const appointmentType = getAppointmentTypeLabel(safeString(appointment.type))

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{getPatientName(appointment)}</TableCell>
                      <TableCell>
                        <div>{getDateLabel(appointment)}</div>
                        <div className="text-xs text-[#6b7280]">{getTimeLabel(appointment)}</div>
                      </TableCell>
                      <TableCell>{appointmentType}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full border ${getStatusBadgeClass(statusLabel)}`}>
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

                            {statusKey === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => openComplete(appointment)}>
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
              <div><span className="font-semibold">Loại khám:</span> {getAppointmentTypeLabel(safeString(selectedAppointment.type))}</div>
              <div><span className="font-semibold">Trạng thái:</span> {getStatusLabel(safeString(selectedAppointment.status))}</div>
              <div><span className="font-semibold">Triệu chứng:</span> {safeString(selectedAppointment.symptoms) || '-'}</div>
              <div><span className="font-semibold">Ghi chú:</span> {safeString(selectedAppointment.notes) || '-'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hoàn tất khám và kê đơn</DialogTitle>
            <DialogDescription>Nhập hồ sơ khám, thuốc, dịch vụ và tùy chọn hẹn tái khám</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Triệu chứng</Label>
                <Textarea
                  value={formState.symptoms}
                  onChange={(event) => setFormState((prev) => ({ ...prev, symptoms: event.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <Label>Chẩn đoán</Label>
                <Textarea
                  value={formState.diagnosis}
                  onChange={(event) => setFormState((prev) => ({ ...prev, diagnosis: event.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <Label>Lời dặn</Label>
                <Textarea
                  value={formState.advice}
                  onChange={(event) => setFormState((prev) => ({ ...prev, advice: event.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Pill className="h-4 w-4 text-sky-600" />
                  Kê đơn thuốc
                </div>
                <Button variant="outline" size="sm" onClick={handleAddMedicineRow}>
                  Thêm thuốc
                </Button>
              </div>

              <div className="space-y-3">
                {formState.medicines.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-[#e5e7eb] p-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label className="text-xs">Thuốc</Label>
                      <Select
                        value={item.medicineId || '__none__'}
                        onValueChange={(value) =>
                          handleMedicineChange(index, 'medicineId', value === '__none__' ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thuốc" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Chọn thuốc</SelectItem>
                          {availableMedicines.map((medicine) => (
                            <SelectItem key={medicine.id} value={medicine.id}>
                              {medicine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs">Số lượng</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => handleMedicineChange(index, 'quantity', event.target.value)}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-xs">Liều dùng</Label>
                      <Input
                        value={item.dosage}
                        onChange={(event) => handleMedicineChange(index, 'dosage', event.target.value)}
                        placeholder="Ví dụ: 2 viên/ngày"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs">Ghi chú</Label>
                      <Input
                        value={item.note}
                        onChange={(event) => handleMedicineChange(index, 'note', event.target.value)}
                      />
                    </div>

                    <div className="flex items-end md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMedicineRow(index)}
                        disabled={formState.medicines.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Stethoscope className="h-4 w-4 text-sky-600" />
                Dịch vụ y tế
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {medicalServices.map((service) => {
                  const selected = formState.medicalServices.some((item) => item.serviceId === service.id)
                  const selectedService = formState.medicalServices.find((item) => item.serviceId === service.id)

                  return (
                    <div key={service.id} className="rounded-xl border border-[#e5e7eb] p-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleServiceToggle(service.id)}
                        />
                        {service.name}
                      </label>
                      {selected && (
                        <Input
                          className="mt-2"
                          placeholder="Ghi chú dịch vụ"
                          value={selectedService?.note || ''}
                          onChange={(event) => handleServiceNoteChange(service.id, event.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-[#e5e7eb] p-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={formState.followUpEnabled}
                  onChange={(event) => setFormState((prev) => ({ ...prev, followUpEnabled: event.target.checked }))}
                />
                Hẹn tái khám
              </label>

              {formState.followUpEnabled && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Ngày tái khám</Label>
                    <Input
                      type="date"
                      value={formState.followUpDate}
                      onChange={(event) => setFormState((prev) => ({ ...prev, followUpDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Giờ tái khám</Label>
                    <Input
                      type="time"
                      value={formState.followUpTime}
                      onChange={(event) => setFormState((prev) => ({ ...prev, followUpTime: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Ghi chú tái khám</Label>
                    <Input
                      value={formState.followUpNote}
                      onChange={(event) => setFormState((prev) => ({ ...prev, followUpNote: event.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleCompleteAppointment()} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
