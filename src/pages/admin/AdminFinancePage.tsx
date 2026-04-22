export function AdminFinancePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý tài chính</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Tổng doanh thu</h3>
          <p className="text-3xl font-bold mt-2">₫50,000,000</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Tháng này</h3>
          <p className="text-3xl font-bold mt-2">₫5,000,000</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Pending</h3>
          <p className="text-3xl font-bold mt-2">₫1,000,000</p>
        </div>
      </div>
    </div>
  )
}
