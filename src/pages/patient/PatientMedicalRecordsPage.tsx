import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, type PatientMedicalRecord } from '@/services/api'

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

export function PatientMedicalRecordsPage() {
  const [records, setRecords] = useState<PatientMedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.patients.getMyMedicalRecords()
        setRecords(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Khong the tai ho so benh an')
      } finally {
        setLoading(false)
      }
    }

    void loadRecords()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Ho so benh an cua toi</h1>
        <p className="text-sm text-muted-foreground">Danh sach ho so benh an tu cac lan kham da hoan tat.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Dang tai ho so benh an...
        </div>
      ) : error ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-destructive">
          Loi: {error}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Chua co ho so benh an nao.
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{record.recordCode || `#${record.id}`}</p>
                  <p className="font-semibold">{record.diagnosis || 'Chua cap nhat chan doan'}</p>
                  <p className="text-sm text-muted-foreground">Bac si: {record.doctorName || '-'}</p>
                  <p className="text-sm text-muted-foreground">Ngay tao: {formatDate(record.createdAt)}</p>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/patient/medical-records/${record.id}`} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Xem chi tiet
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
