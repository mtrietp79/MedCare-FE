import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientChart } from '@/components/admin/patient-chart'
import { SpecialtyChart } from '@/components/admin/specialty-chart'

export function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Tabs defaultValue="patients" className="w-full">
        <TabsList>
          <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
          <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger>
          <TabsTrigger value="doctors">Bác sĩ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patients" className="mt-6">
          <PatientChart />
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-6">
          <SpecialtyChart />
        </TabsContent>
        
        <TabsContent value="doctors" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold">Danh sách bác sĩ</h3>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
