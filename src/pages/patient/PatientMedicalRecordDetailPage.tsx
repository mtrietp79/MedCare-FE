import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { api, type PatientMedicalRecord } from '@/services/api'

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export function PatientMedicalRecordDetailPage() {
  const { id } = useParams()
  const [record, setRecord] = useState<PatientMedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadRecord = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.patients.getMyMedicalRecordById(id)
        setRecord(data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Khong the tai chi tiet ho so benh an')
      } finally {
        setLoading(false)
      }
    }

    void loadRecord()
  }, [id])

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
        Dang tai chi tiet ho so benh an...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center text-destructive">
        Loi: {error}
      </div>
    )
  }

  if (!record) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
        Khong tim thay ho so benh an.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/patient/medical-records" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Quay lai danh sach benh an
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold">{record.recordCode || `#${record.id}`}</h1>
          <p><span className="font-semibold">Bac si:</span> {record.doctorName || '-'}</p>
          <p><span className="font-semibold">Ngay tao:</span> {formatDate(record.createdAt)}</p>
          <p><span className="font-semibold">Ngay kham:</span> {formatDate(record.appointmentDate)}</p>
          <p><span className="font-semibold">Trieu chung:</span> {record.symptoms || '-'}</p>
          <p><span className="font-semibold">Chan doan:</span> {record.diagnosis || '-'}</p>
          <p><span className="font-semibold">Loi dan:</span> {record.advice || '-'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
