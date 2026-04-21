import React from 'react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  // Dữ liệu giả lập cho bảng
  const appointments = [
    { id: 1, patient: 'Nguyễn Văn A', doctor: 'Dr. Trần Minh Tuấn', specialty: 'Tim mạch', time: '14:30', status: 'Hoàn thành' },
    { id: 2, patient: 'Phạm Thị B', doctor: 'Dr. Lê Hải Yên', specialty: 'Nhi khoa', time: '15:00', status: 'Đang chờ' },
    { id: 3, patient: 'Trương Văn C', doctor: 'Dr. Hoàng Minh Khang', specialty: 'Ngoại khoa', time: '15:30', status: 'Đã xác nhận' },
    { id: 4, patient: 'Đinh Thị D', doctor: 'Dr. Vũ Thanh Hương', specialty: 'Da liễu', time: '16:00', status: 'Hoàn thành' },
    { id: 5, patient: 'Bùi Văn E', doctor: 'Dr. Trần Minh Tuấn', specialty: 'Tim mạch', time: '16:30', status: 'Đã hủy' },
  ];

  // Hàm helper để render class trạng thái
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'status-completed';
      case 'Đang chờ': return 'status-pending';
      case 'Đã xác nhận': return 'status-confirmed';
      case 'Đã hủy': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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
          <a href="#" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </a>
          <a href="#" className="nav-item">
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
          <h1 className="page-title">Tổng quan</h1>

          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng lịch hẹn</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="stat-value">1,245</div>
              <div className="stat-trend">
                <span className="trend-up">↗ +12%</span> So với tuần trước
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Bệnh nhân hoạt động</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div className="stat-value">842</div>
              <div className="stat-trend">
                <span className="trend-up">↗ +5%</span> So với tuần trước
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Bác sĩ đang làm việc</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              </div>
              <div className="stat-value">48</div>
              <div className="stat-trend">
                <span className="trend-up">↗ +2%</span> So với tuần trước
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Doanh thu tháng này</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
              <div className="stat-value">450M đ</div>
              <div className="stat-trend">
                <span className="trend-up">↗ +8.2%</span> So với tuần trước
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">Số lượng bệnh nhân theo tháng</h3>
              {/* Giả lập biểu đồ cột bằng CSS */}
              <div className="bar-chart-mock">
                <div className="bar" style={{ height: '30%', backgroundColor: '#e0f2fe' }}></div>
                <div className="bar" style={{ height: '40%', backgroundColor: '#bae6fd' }}></div>
                <div className="bar" style={{ height: '45%', backgroundColor: '#7dd3fc' }}></div>
                <div className="bar" style={{ height: '55%', backgroundColor: '#38bdf8' }}></div>
                <div className="bar" style={{ height: '60%', backgroundColor: '#0ea5e9' }}></div>
                <div className="bar" style={{ height: '65%', backgroundColor: '#0284c7' }}></div>
                <div className="bar" style={{ height: '70%', backgroundColor: '#0369a1' }}></div>
                <div className="bar" style={{ height: '80%', backgroundColor: '#075985' }}></div>
                <div className="bar" style={{ height: '85%', backgroundColor: '#0c4a6e' }}></div>
                <div className="bar" style={{ height: '90%', backgroundColor: '#082f49' }}></div>
                <div className="bar" style={{ height: '95%', backgroundColor: '#042f2e' }}></div>
                <div className="bar" style={{ height: '100%', backgroundColor: '#022c22' }}></div>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Số lượng bệnh nhân theo chuyên khoa</h3>
              {/* Giả lập biểu đồ tròn bằng CSS conic-gradient */}
              <div className="pie-chart-mock-container">
                <div className="pie-chart"></div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="table-container">
            <div className="table-header">
              <h3>Lịch hẹn gần đây</h3>
              <a href="#" className="view-all">Xem tất cả</a>
            </div>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Chuyên khoa</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>{apt.patient}</td>
                    <td>{apt.doctor}</td>
                    <td>{apt.specialty}</td>
                    <td>{apt.time}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(apt.status)}`}>
                        {apt.status}
                      </span>
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

export default Dashboard;