export function AdminSpecialtiesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý chuyên khoa</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Tên chuyên khoa</th>
              <th className="text-left py-2">Số bác sĩ</th>
              <th className="text-left py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-2">Tim mạch</td>
              <td className="py-2">5</td>
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
