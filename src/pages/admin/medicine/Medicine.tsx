import React from 'react';
import './Medicine.css';
import './Dashboard.css'; // Sử dụng lại các class chung (sidebar, table, search...)

const Medicine: React.FC = () => {
  const medicineList = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Giảm đau', manufacturer: 'Traphaco', stock: 450, price: '5.000 đ', expiry: '2025-06-30', status: 'Còn hàng' },
    { id: 2, name: 'Aspirin 100mg', category: 'Tim mạch', manufacturer: 'Pharmatech', stock: 120, price: '8.000 đ', expiry: '2025-12-31', status: 'Còn hàng' },
    { id: 3, name: 'Amoxicillin 500mg', category: 'Kháng sinh', manufacturer: 'Medipharma', stock: 25, price: '12.000 đ', expiry: '2024-12-15', status: 'Sắp hết' },
    { id: 4, name: 'Vitamin C 1000mg', category: 'Vitamin', manufacturer: 'Sunway', stock: 800, price: '3.500 đ', expiry: '2026-03-20', status: 'Còn hàng' },
    { id: 5, name: 'Ibuprofen 400mg', category: 'Giảm đau', manufacturer: 'Traphaco', stock: 5, price: '6.000 đ', expiry: '2025-08-10', status: 'Hết hàng' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Còn hàng': return 'status-instock';
      case 'Sắp hết': return 'status-low';
      case 'Hết hàng': return 'status-outofstock';
      default: return '';
    }
  };

  const getStockClass = (stock: number) => {
    if (stock <= 5) return 'stock-out';
    if (stock <= 30) return 'stock-low';
    return '';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - Active 'Thuốc' */}
      <aside className="sidebar">
        {/* ... (Sidebar code tương tự các trang trước) */}
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-title">MedCare Admin Panel</div>
        </header>

        <div className="content-wrapper">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title-group">
              <h1>Quản lý thuốc</h1>
              <p>Quản lý kho thuốc và thông tin chi tiết các loại thuốc</p>
            </div>
            <button className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm thuốc
            </button>
          </div>

          {/* Alert Section */}
          <div className="alert-container">
            <div className="alert-box warning">
              <div className="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div className="alert-content">
                <h4>2 loại thuốc sắp hết hàng</h4>
                <p>Vui lòng cập nhật tồn kho</p>
              </div>
            </div>
            <div className="alert-box danger">
              <div className="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div className="alert-content">
                <h4>6 loại thuốc đã hết hạn</h4>
                <p>Cần loại bỏ ngay lập tức</p>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="controls-row">
            <div className="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" className="search-input" placeholder="Tìm kiếm thuốc..." />
            </div>
            <select className="filter-select"><option>Tất cả</option></select>
          </div>

          {/* Medicine Table */}
          <div className="data-card">
            <div className="data-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-2-2H5L3 8v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"></path><path d="M3 8h18"></path><path d="M10 12h4"></path></svg>
                <h3 style={{ fontSize: '16px' }}>Danh sách thuốc ({medicineList.length})</h3>
              </div>
            </div>
            <table className="data-table medicine-table">
              <thead>
                <tr>
                  <th>Tên thuốc</th>
                  <th>Danh mục</th>
                  <th>Nhà sản xuất</th>
                  <th>Tồn kho</th>
                  <th>Giá</th>
                  <th>Hạn sử dụng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {medicineList.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td>{m.category}</td>
                    <td>{m.manufacturer}</td>
                    <td>
                      <span className={`stock-bubble ${getStockClass(m.stock)}`}>
                        {m.stock} hộp
                      </span>
                    </td>
                    <td>{m.price}</td>
                    <td style={{ color: '#6b7280' }}>{m.expiry}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon edit">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="btn-icon delete">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Medicine;