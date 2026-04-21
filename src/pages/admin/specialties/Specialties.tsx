import React from 'react';
import './Specialties.css';

const Specialties: React.FC = () => {
  // Dữ liệu mock dựa trên hình ảnh
  const specialtiesList = [
    { id: 1, name: 'Tim mạch', desc: 'Chẩn đoán và điều trị các bệnh về tim và mạch máu...', doctorsCount: 6 },
    { id: 2, name: 'Da liễu', desc: 'Điều trị các bệnh về da, tóc và móng...', doctorsCount: 6 },
    { id: 3, name: 'Nhi khoa', desc: 'Chăm sóc sức khỏe trẻ em từ sơ sinh đến 18 tuổi...', doctorsCount: 6 },
    { id: 4, name: 'Nội khoa', desc: 'Khám và điều trị các bệnh nội khoa tổng quát...', doctorsCount: 6 },
    { id: 5, name: 'Thần kinh', desc: 'Điều trị các bệnh về não và hệ thần kinh...', doctorsCount: 6 },
    { id: 6, name: 'Chấn thương chỉnh hình', desc: 'Điều trị các bệnh về xương khớp và cơ...', doctorsCount: 6 },
    { id: 7, name: 'Sản phụ khoa', desc: 'Chăm sóc sức khỏe phụ nữ và thai sản...', doctorsCount: 6 },
    { id: 8, name: 'Mắt', desc: 'Khám và điều trị các bệnh về mắt...', doctorsCount: 6 },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar - Cập nhật active class sang 'Chuyên khoa' */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div className="logo-text">
            <h2>MedCare Admin</h2>
            <p>Quản lý hệ thống</p>
          </div>
        </div>
        
        <nav className="nav-menu">
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </a>
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            Chuyên khoa
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Bác sĩ
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Tài chính
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 19 12a2.828 2.828 0 0 0-4-4l-8.5 8.5a2 2 0 0 0 0 2.828l1.172 1.172a2 2 0 0 0 2.828 0Z"></path><path d="m7.5 10.5 5.5 5.5"></path></svg>
            Thuốc
          </a>
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Đăng xuất
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            MedCare Admin Panel
          </div>
        </header>

        <div className="content-wrapper">
          
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title-group">
              <h1>Quản lý chuyên khoa</h1>
              <p>Quản lý tất cả các chuyên khoa y tế trong hệ thống</p>
            </div>
            <button className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm chuyên khoa
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" className="search-input" placeholder="Tìm kiếm chuyên khoa..." />
          </div>

          {/* Data List */}
          <div className="data-card">
            <div className="data-card-header">
              <h3>Danh sách chuyên khoa ({specialtiesList.length})</h3>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-name">Tên chuyên khoa</th>
                  <th className="col-desc">Mô tả</th>
                  <th className="col-count">Số bác sĩ</th>
                  <th className="col-actions">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {specialtiesList.map((item) => (
                  <tr key={item.id}>
                    <td className="col-name">{item.name}</td>
                    <td className="col-desc">{item.desc}</td>
                    <td className="col-count">
                      <span className="badge-count">{item.doctorsCount}</span>
                    </td>
                    <td className="col-actions">
                      <div className="action-btns">
                        <button className="btn-icon edit" title="Sửa">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="btn-icon delete" title="Xóa">
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

export default Specialties;