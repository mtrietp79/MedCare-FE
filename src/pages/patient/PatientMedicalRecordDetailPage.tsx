import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PatientBackLink, PatientEmptyState, PatientErrorState } from '@/components/patient/patient-ui'
import { PatientMedicalRecordDetails } from '@/components/patient/PatientMedicalRecordDetails'
import { api, type PatientMedicalRecord } from '@/services/api'

export function PatientMedicalRecordDetailPage() {
  const { id } = useParams()
  const [record, setRecord] = useState<PatientMedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecord = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const data = await api.patients.getMyMedicalRecordById(id)
      setRecord(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải chi tiết hồ sơ bệnh án.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadRecord()
  }, [loadRecord])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <PatientErrorState message={`Lỗi: ${error}`} onRetry={() => void loadRecord()} />
    )
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <PatientBackLink to="/patient/medical-records">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách bệnh án
        </PatientBackLink>
        <PatientEmptyState message="Không tìm thấy hồ sơ bệnh án." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PatientBackLink to="/patient/medical-records">
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách bệnh án
      </PatientBackLink>
      <PatientMedicalRecordDetails record={record} />
    </div>
  )
}
