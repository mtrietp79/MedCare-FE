import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PatientEmptyState,
  PatientErrorState,
  PatientInfoRow,
  PatientLoadingSkeleton,
  PatientPageHeader,
} from '@/components/patient/patient-ui'
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
  if (dateText === '-') return timeText.slice(0, 5)
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
      <PatientPageHeader
        title="Hồ sơ bệnh án của tôi"
        description="Danh sách hồ sơ bệnh án từ các lần khám đã hoàn tất."
      />

      {loading ? (
        <PatientLoadingSkeleton rows={3} />
      ) : error ? (
        <PatientErrorState message={`Lỗi: ${error}`} onRetry={() => void loadRecords()} />
      ) : records.length === 0 ? (
        <PatientEmptyState
          icon={FileText}
          message="Chưa có hồ sơ bệnh án nào."
        />
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card
              key={record.id}
              className="group overflow-hidden transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <div className="border-b border-border/60 bg-primary/5 px-6 py-4 lg:w-56 lg:border-b-0 lg:border-r">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Mã bệnh án
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold text-primary">
                      {record.recordCode || `#${record.id}`}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">
                      {record.diagnosis || 'Chưa cập nhật chẩn đoán'}
                    </p>
                  </div>

                  <div className="grid flex-1 gap-4 p-6 sm:grid-cols-2">
                    <PatientInfoRow
                      icon={UserRound}
                      label="Bác sĩ"
                      value={record.doctor?.fullName || record.doctorName || '-'}
                    />
                    <PatientInfoRow
                      icon={Stethoscope}
                      label="Loại khám"
                      value={getAppointmentTypeLabel({
                        typeCode: record.typeCode,
                        appointmentTypeCode: record.appointmentTypeCode,
                      })}
                    />
                    <PatientInfoRow
                      icon={Calendar}
                      label="Ngày khám"
                      value={formatDateTime(record.appointmentDate, record.appointmentTime)}
                    />
                    <PatientInfoRow
                      icon={Clock}
                      label="Ngày tạo"
                      value={formatDate(record.recordCreatedAt || record.createdAt)}
                    />
                  </div>

                  <div className="flex items-center border-t border-border/60 px-6 py-4 lg:w-44 lg:border-l lg:border-t-0">
                    <Button asChild className="w-full gap-2 shadow-sm" variant="default">
                      <Link to={`/patient/medical-records/${record.id}`}>
                        <FileText className="h-4 w-4" />
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
