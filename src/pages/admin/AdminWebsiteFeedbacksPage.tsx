import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, MessageSquare, Search, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { websiteFeedbackService, type WebsiteFeedback } from '@/services/websiteFeedbackService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

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
    return <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Đã duyệt</Badge>
  }

  if (item.status === 'HIDDEN') {
    return <Badge className="border border-slate-300 bg-slate-100 text-slate-700">Đã ẩn</Badge>
  }

  return <Badge className="border border-amber-200 bg-amber-50 text-amber-700">Chưa duyệt</Badge>
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
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải danh sách phản hồi website.')
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

  const handleApproveOrUnhide = async (item: WebsiteFeedback) => {
    const actionLabel = item.status === 'HIDDEN' ? 'bỏ ẩn' : 'duyệt'

    try {
      setActionLoadingKey(`approve-${item.id}`)
      if (item.status === 'HIDDEN') {
        await websiteFeedbackService.unhide(item.id)
      } else {
        await websiteFeedbackService.approve(item.id)
      }

      toast({ title: 'Thành công', description: `Đã ${actionLabel} feedback.` })
      await loadFeedbacks()
    } catch (actionError: any) {
      toast({
        title: 'Lỗi',
        description: actionError?.message || `Không thể ${actionLabel} feedback.`,
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
      toast({ title: 'Thành công', description: 'Đã ẩn feedback.' })
      await loadFeedbacks()
    } catch (actionError: any) {
      toast({
        title: 'Lỗi',
        description: actionError?.message || 'Không thể ẩn feedback.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa feedback này?')
    if (!confirmed) return

    try {
      setActionLoadingKey(`delete-${id}`)
      await websiteFeedbackService.remove(id)
      toast({ title: 'Thành công', description: 'Đã xóa feedback.' })
      await loadFeedbacks()
    } catch (actionError: any) {
      toast({
        title: 'Lỗi',
        description: actionError?.message || 'Không thể xóa feedback.',
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
        <p className="text-muted-foreground">Quản lý phản hồi đánh giá MedCare từ homepage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách feedback</CardTitle>
          <CardDescription>Duyệt, ẩn/bỏ ẩn hoặc xóa phản hồi website/cơ sở y tế</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, email hoặc nội dung..."
              className="pl-9"
            />
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadFeedbacks()} />}
          {!loading && !error && filteredFeedbacks.length === 0 && (
            <AdminEmptyState title="Chưa có feedback phù hợp." />
          )}

          {!loading && !error && filteredFeedbacks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
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
                            onClick={() => void handleApproveOrUnhide(item)}
                            disabled={approveDisabled}
                          >
                            {item.status === 'HIDDEN' ? <Eye className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {item.status === 'HIDDEN' ? 'Bỏ ẩn' : 'Duyệt'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleHide(item.id)}
                            disabled={hideDisabled}
                          >
                            <EyeOff className="h-4 w-4" />
                            Ẩn
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => void handleDelete(item.id)}
                            disabled={isLoadingAction('delete', item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
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
