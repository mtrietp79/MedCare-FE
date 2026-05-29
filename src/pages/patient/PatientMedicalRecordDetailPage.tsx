import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p>Lỗi: {error}</p>
        <Button variant="outline" className="mt-3" onClick={() => void loadRecord()}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Link to="/patient/medical-records" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách bệnh án
        </Link>
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Không tìm thấy hồ sơ bệnh án.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/patient/medical-records" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách bệnh án
      </Link>
      <PatientMedicalRecordDetails record={record} />
    </div>
  )
}
