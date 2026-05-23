import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, EyeOff, MessageSquare, Search, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { websiteFeedbackService, type WebsiteFeedback } from '@/services/websiteFeedbackService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

interface HttpError extends Error {
  status?: number
  data?: unknown
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Khong the tai danh sach feedback website.'
}

function formatDateDDMMYYYY(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${day}-${month}-${year}`
}

function getStatusBadge(item: WebsiteFeedback) {
  if (item.status === 'APPROVED') {
    return <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Da duyet</Badge>
  }

  if (item.status === 'HIDDEN') {
    return <Badge className="border border-slate-300 bg-slate-100 text-slate-700">Da an</Badge>
  }

  return <Badge className="border border-amber-200 bg-amber-50 text-amber-700">Chua duyet</Badge>
}

export function AdminWebsiteFeedbacksPage() {
  const { toast } = useToast()

  const [feedbacks, setFeedbacks] = useState<WebsiteFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [actionLoadingKey, setActionLoadingKey] = useState('')

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await websiteFeedbackService.getAdminFeedbacks()
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch (fetchError: unknown) {
      const status = getErrorStatus(fetchError)
      const message = getErrorMessage(fetchError)

      if (status === 401) {
        setError('Phien dang nhap da het han. Vui long dang nhap lai.')
      } else if (status === 403) {
        setError('Khong co quyen truy cap du lieu feedback website.')
      } else if (status === 500) {
        setError('He thong tam thoi bi loi. Vui long thu lai sau.')
      } else {
        setError(message)
      }

      toast({
        title: 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFeedbacks()
  }, [])

  const filteredFeedbacks = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return feedbacks
    return feedbacks.filter((item) =>
      [item.fullName, item.email, item.comment].some((field) =>
        String(field || '').toLowerCase().includes(text)
      )
    )
  }, [feedbacks, keyword])

  const isLoadingAction = (action: 'approve' | 'hide' | 'delete', id: string) =>
    actionLoadingKey === `${action}-${id}`

  const handleApprove = async (item: WebsiteFeedback) => {
    try {
      setActionLoadingKey(`approve-${item.id}`)
      await websiteFeedbackService.approve(item.id)
      toast({ title: 'Thanh cong', description: 'Da duyet feedback.' })
      await loadFeedbacks()
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Khong co quyen' : 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleHide = async (id: string) => {
    try {
      setActionLoadingKey(`hide-${id}`)
      await websiteFeedbackService.hide(id)
      toast({ title: 'Thanh cong', description: 'Da an feedback.' })
      await loadFeedbacks()
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Khong co quyen' : 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Ban co chac muon xoa feedback nay?')
    if (!confirmed) return

    try {
      setActionLoadingKey(`delete-${id}`)
      await websiteFeedbackService.remove(id)
      toast({ title: 'Thanh cong', description: 'Da xoa feedback.' })
      await loadFeedbacks()
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Khong co quyen' : 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback website</h1>
        <p className="text-muted-foreground">Quan ly phan hoi danh gia MedCare tu homepage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach feedback</CardTitle>
          <CardDescription>Duyet, an hoac xoa phan hoi website/co so y te</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim theo ten, email hoac noi dung..."
              className="pl-9"
            />
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadFeedbacks()} />}
          {!loading && !error && filteredFeedbacks.length === 0 && (
            <AdminEmptyState title="Chua co feedback phu hop." />
          )}

          {!loading && !error && filteredFeedbacks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nguoi gui</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Noi dung</TableHead>
                  <TableHead>Ngay gui</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-right">Hanh dong</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map((item) => {
                  const approveDisabled = item.status === 'APPROVED' || isLoadingAction('approve', item.id)
                  const hideDisabled = item.status !== 'APPROVED' || isLoadingAction('hide', item.id)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.fullName || '-'}</TableCell>
                      <TableCell>{item.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {item.rating || 0}/5
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px]">{item.comment || '-'}</TableCell>
                      <TableCell>{formatDateDDMMYYYY(item.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleApprove(item)}
                            disabled={approveDisabled}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Duyet
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleHide(item.id)}
                            disabled={hideDisabled}
                          >
                            <EyeOff className="h-4 w-4" />
                            An
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => void handleDelete(item.id)}
                            disabled={isLoadingAction('delete', item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Xoa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
