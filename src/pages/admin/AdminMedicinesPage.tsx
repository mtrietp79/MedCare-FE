export function AdminMedicinesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý thuốc</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Tên thuốc</th>
              <th className="text-left py-2">Liều lượng</th>
              <th className="text-left py-2">Số lượng</th>
              <th className="text-left py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-2">Paracetamol</td>
              <td className="py-2">500mg</td>
              <td className="py-2">1000</td>
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
