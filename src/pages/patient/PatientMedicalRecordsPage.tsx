import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type PatientMedicalRecord } from '@/services/api'
import { getAppointmentTypeLabel } from '@/lib/appointment-type'

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function formatDateTime(dateValue?: string, timeValue?: string) {
  const dateText = formatDate(dateValue)
  const timeText = String(timeValue || '').trim()
  if (!timeText) return dateText
  if (dateText === '-') return timeText
  return `${dateText} ${timeText.slice(0, 5)}`
}

export function PatientMedicalRecordsPage() {
  const [records, setRecords] = useState<PatientMedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.patients.getMyMedicalRecords()
      setRecords(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải hồ sơ bệnh án.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Hồ sơ bệnh án của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách hồ sơ bệnh án từ các lần khám đã hoàn tất.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 rounded-3xl border bg-white p-6">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>Lỗi: {error}</p>
          <Button variant="outline" className="mt-3" onClick={() => void loadRecords()}>
            Thử lại
          </Button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Chưa có hồ sơ bệnh án nào.
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{record.recordCode || `#${record.id}`}</p>
                  <p className="font-semibold">{record.diagnosis || 'Chưa cập nhật chẩn đoán'}</p>
                  <p className="text-sm text-muted-foreground">Bác sĩ: {record.doctor?.fullName || record.doctorName || '-'}</p>
                  <p className="text-sm text-muted-foreground">Loại khám: {getAppointmentTypeLabel({
                    typeCode: record.typeCode,
                    appointmentTypeCode: record.appointmentTypeCode,
                  })}</p>
                  <p className="text-sm text-muted-foreground">
                    Ngày khám: {formatDateTime(record.appointmentDate, record.appointmentTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ngày tạo: {formatDate(record.recordCreatedAt || record.createdAt)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/patient/medical-records/${record.id}`} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Xem chi tiết
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
