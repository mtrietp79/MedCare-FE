'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PatientChart() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Số lượng bệnh nhân theo tháng</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center text-muted-foreground">
        Dữ liệu thống kê bệnh nhân chưa khả dụng. Vui lòng kiểm tra lại khi backend hỗ trợ endpoint phù hợp.
      </CardContent>
    </Card>
  )
}
