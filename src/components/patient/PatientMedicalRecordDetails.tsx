import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PatientMedicalRecord } from '@/services/api'
import { getAppointmentStatusClass, getAppointmentStatusLabel } from '@/lib/appointment-status'

interface PatientMedicalRecordDetailsProps {
  record: PatientMedicalRecord
  className?: string
}

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function formatTime(value?: string): string {
  if (!value) return '-'
  const raw = String(value).trim()
  if (!raw) return '-'
  if (raw.includes(':')) return raw.slice(0, 5)
  return raw
}

function formatDateTime(dateValue?: string, timeValue?: string): string {
  const dateText = formatDate(dateValue)
  const timeText = formatTime(timeValue)
  if (dateText === '-' && timeText === '-') return '-'
  if (dateText === '-') return timeText
  if (timeText === '-') return dateText
  return `${dateText} ${timeText}`
}

function formatCurrencyVnd(value?: number): string {
  const amount = Number(value ?? 0)
  return `${new Intl.NumberFormat('vi-VN').format(Number.isFinite(amount) ? amount : 0)} VND`
}

function invoiceStatusLabel(status?: string): string {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  if (normalized === 'FAILED') return 'Thanh toán thất bại'
  return 'Chưa thanh toán'
}

function invoiceStatusClass(status?: string): string {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'CANCELLED') return 'bg-slate-100 text-slate-700 border-slate-300'
  if (normalized === 'FAILED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function textOrDash(value?: string): string {
  const raw = String(value || '').trim()
  return raw || '-'
}

export function PatientMedicalRecordDetails({ record, className }: PatientMedicalRecordDetailsProps) {
  const medicines = Array.isArray(record.medicines) ? record.medicines : []
  const services = Array.isArray(record.services) ? record.services : []
  const invoice = record.invoice
  const followUp = record.followUp
  const recordCode = record.recordCode || record.recordId || record.id
  const doctorName = record.doctor?.fullName || record.doctorName || '-'
  const consultationFee = Number(invoice?.consultationFee ?? 0)
  const medicineFee = Number(invoice?.medicineFee ?? invoice?.medicineTotal ?? 0)
  const serviceFee = Number(invoice?.serviceFee ?? invoice?.serviceTotal ?? 0)
  const calculatedTotal = consultationFee + medicineFee + serviceFee
  const invoiceTotal = Number(invoice?.totalAmount ?? calculatedTotal)

  return (
    <div className={`space-y-4 ${className || ''}`.trim()}>
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã bệnh án</p>
            <p className="text-base font-semibold">{recordCode}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày giờ khám</p>
            <p className="text-base font-semibold">{formatDateTime(record.appointmentDate, record.appointmentTime)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bác sĩ khám</p>
            <p className="font-medium">{doctorName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày tạo hồ sơ</p>
            <p className="font-medium">{formatDate(record.recordCreatedAt || record.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><span className="font-semibold">Triệu chứng:</span> {textOrDash(record.symptoms)}</p>
          <p><span className="font-semibold">Chẩn đoán:</span> {textOrDash(record.diagnosis)}</p>
          <p><span className="font-semibold">Kế hoạch điều trị:</span> {textOrDash(record.treatmentPlan)}</p>
          <p><span className="font-semibold">Lời dặn:</span> {textOrDash(record.advice)}</p>
          <p><span className="font-semibold">Đơn thuốc (text):</span> {textOrDash(record.prescriptionText)}</p>
          <p><span className="font-semibold">Ghi chú:</span> {textOrDash(record.note)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 font-semibold">Danh sách thuốc</p>
          {medicines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thuốc được kê.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-2 py-2 font-medium">Tên thuốc</th>
                    <th className="px-2 py-2 font-medium">SL</th>
                    <th className="px-2 py-2 font-medium">Đơn vị</th>
                    <th className="px-2 py-2 font-medium">Liều dùng</th>
                    <th className="px-2 py-2 font-medium">Ghi chú</th>
                    <th className="px-2 py-2 text-right font-medium">Đơn giá</th>
                    <th className="px-2 py-2 text-right font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((item, index) => (
                    <tr key={`${item.id || item.medicineId || index}`} className="border-b last:border-0">
                      <td className="px-2 py-2">{textOrDash(item.name)}</td>
                      <td className="px-2 py-2">{item.quantity ?? '-'}</td>
                      <td className="px-2 py-2">{textOrDash(item.unit)}</td>
                      <td className="px-2 py-2">{textOrDash(item.dosage)}</td>
                      <td className="px-2 py-2">{textOrDash(item.note)}</td>
                      <td className="px-2 py-2 text-right">
                        {item.unitPrice !== undefined ? formatCurrencyVnd(item.unitPrice) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.lineTotal !== undefined ? formatCurrencyVnd(item.lineTotal) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 font-semibold">Danh sách dịch vụ phát sinh</p>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có dịch vụ phát sinh.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-2 py-2 font-medium">Tên dịch vụ</th>
                    <th className="px-2 py-2 font-medium">SL</th>
                    <th className="px-2 py-2 font-medium">Kết quả</th>
                    <th className="px-2 py-2 font-medium">Ghi chú</th>
                    <th className="px-2 py-2 text-right font-medium">Đơn giá</th>
                    <th className="px-2 py-2 text-right font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((item, index) => (
                    <tr key={`${item.id || item.serviceId || index}`} className="border-b last:border-0">
                      <td className="px-2 py-2">{textOrDash(item.name)}</td>
                      <td className="px-2 py-2">{item.quantity ?? '-'}</td>
                      <td className="px-2 py-2">{textOrDash(item.result)}</td>
                      <td className="px-2 py-2">{textOrDash(item.note)}</td>
                      <td className="px-2 py-2 text-right">
                        {item.unitPrice !== undefined ? formatCurrencyVnd(item.unitPrice) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.lineTotal !== undefined ? formatCurrencyVnd(item.lineTotal) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-semibold">Thông tin bác sĩ khám</p>
          <p><span className="font-medium">Họ tên:</span> {doctorName}</p>
          <p><span className="font-medium">SĐT:</span> {textOrDash(record.doctor?.phone)}</p>
          <p><span className="font-medium">Email:</span> {textOrDash(record.doctor?.email)}</p>
          <p><span className="font-medium">Chuyên khoa:</span> {textOrDash(record.doctor?.specialtyName)}</p>
        </CardContent>
      </Card>

      {invoice ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Thông tin hóa đơn sau khám</p>
              <Badge className={`rounded-full border ${invoiceStatusClass(invoice.status)}`}>
                {invoiceStatusLabel(invoice.status)}
              </Badge>
            </div>
            <p><span className="font-medium">Mã hóa đơn:</span> {textOrDash(invoice.invoiceCode)}</p>
            <p><span className="font-medium">Phí khám:</span> {formatCurrencyVnd(consultationFee)}</p>
            <p><span className="font-medium">Tiền thuốc:</span> {formatCurrencyVnd(medicineFee)}</p>
            <p><span className="font-medium">Tiền dịch vụ:</span> {formatCurrencyVnd(serviceFee)}</p>
            <p><span className="font-medium">Công thức:</span> Tổng tiền = Phí khám + Tiền thuốc + Tiền dịch vụ</p>
            <p>
              <span className="font-medium">Tổng tiền:</span>{' '}
              {`${formatCurrencyVnd(invoiceTotal)} = ${formatCurrencyVnd(consultationFee)} + ${formatCurrencyVnd(medicineFee)} + ${formatCurrencyVnd(serviceFee)}`}
            </p>
            {invoice.paymentDate ? (
              <p><span className="font-medium">Ngày thanh toán:</span> {formatDate(invoice.paymentDate)}</p>
            ) : null}
            <p><span className="font-medium">Có thể thanh toán online:</span> {invoice.canPayOnline ? 'Có' : 'Không'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Không phát sinh hóa đơn sau khám.
          </CardContent>
        </Card>
      )}

      {followUp ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Lịch tái khám</p>
              <Badge className={`rounded-full border ${getAppointmentStatusClass(followUp.status, followUp.statusDisplay)}`}>
                {getAppointmentStatusLabel(followUp.status, followUp.statusDisplay)}
              </Badge>
            </div>
            <p><span className="font-medium">Mã lịch:</span> {textOrDash(followUp.appointmentCode || followUp.appointmentId)}</p>
            <p>
              <span className="font-medium">Thời gian:</span>{' '}
              {formatDateTime(followUp.appointmentDate, followUp.appointmentTime)}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
