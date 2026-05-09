import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function DoctorDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Lịch Khám Hôm Nay</p>
          <p className="text-3xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Bệnh Nhân Chờ Khám</p>
          <p className="text-3xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Tổng Lịch Khám</p>
          <p className="text-3xl font-bold">0</p>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
          <TabsTrigger value="appointments">Lịch Hẹn Sắp Tới</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Chào mừng!</h3>
            <p className="text-gray-600 mt-2">Quản lý lịch khám và bệnh nhân của bạn từ đây</p>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Lịch Hẹn Sắp Tới</h3>
            <p className="text-gray-600 mt-2">Không có lịch hẹn nào</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
