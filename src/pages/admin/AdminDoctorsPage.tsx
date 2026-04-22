export function AdminDoctorsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý bác sĩ</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Tên</th>
              <th className="text-left py-2">Chuyên khoa</th>
              <th className="text-left py-2">Trạng thái</th>
              <th className="text-left py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-2">Dr. Nguyễn Văn A</td>
              <td className="py-2">Tim mạch</td>
              <td className="py-2">Hoạt động</td>
              <td className="py-2">
                <button className="text-primary hover:underline">Sửa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
