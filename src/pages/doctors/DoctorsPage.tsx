import { DoctorFilter } from '@/components/doctors/doctor-filter'
import { DoctorCard } from '@/components/doctors/doctor-card'

export function DoctorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Danh sách bác sĩ</h1>
        <p className="text-muted-foreground">Tìm kiếm và đặt lịch với bác sĩ chuyên khoa</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <DoctorFilter />
        </div>
        
        <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample doctor cards - replace with actual data */}
            <DoctorCard
              doctor={{
                id: '1',
                name: 'Dr. Nguyễn Văn A',
                specialty: 'Tim mạch',
                image: '/placeholder-user.jpg',
                experience: 10,
                rating: 4.8,
                reviewCount: 120,
                education: 'Bác sĩ Chuyên khoa I',
                hospital: 'Bệnh viện Đa khoa',
                consultationFee: 450000,
              }}
            />
            <DoctorCard
              doctor={{
                id: '2',
                name: 'Dr. Trần Thị B',
                specialty: 'Nhi khoa',
                image: '/placeholder-user.jpg',
                experience: 8,
                rating: 4.9,
                reviewCount: 95,
                education: 'Thạc sĩ Y khoa',
                hospital: 'Bệnh viện Nhi đồng',
                consultationFee: 420000,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
