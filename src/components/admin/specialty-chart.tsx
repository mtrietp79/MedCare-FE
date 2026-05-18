'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SpecialtyChart() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Số lượng bệnh nhân theo chuyên khoa</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center text-muted-foreground">
        Dữ liệu chuyên khoa chưa khả dụng. Vui lòng kiểm tra lại khi backend hỗ trợ endpoint phù hợp.
      </CardContent>
    </Card>
  )
}
