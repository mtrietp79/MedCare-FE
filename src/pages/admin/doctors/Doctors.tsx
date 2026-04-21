import React from 'react';
import './Doctors.css';
import './Dashboard.css'; // Kế thừa sidebar style

const Doctors: React.FC = () => {
  const doctorsList = [
    { id: 1, name: 'BS. Nguyễn Văn An', specialty: 'Tim mạch', rating: 4.9, appointments: 18, status: 'Hoạt động' },
    { id: 2, name: 'BS. Trần Thị Bình', specialty: 'Da liễu', rating: 4.8, appointments: 17, status: 'Hoạt động' },
    { id: 3, name: 'BS. Lê Minh Cường', specialty: 'Nhi khoa', rating: 4.9, appointments: 17, status: 'Hoạt động' },
    { id: 4, name: 'BS. Phạm Thu Hà', specialty: 'Nội khoa', rating: 4.7, appointments: 20, status: 'Hoạt động' },
    { id: 5, name: 'BS. Hoàng Văn Đức', specialty: 'Thần kinh', rating: 4.9, appointments: 8, status: 'Hoạt động' },
    { id: 6, name: 'BS. Ngô Thị Lan', specialty: 'Sản phụ khoa', rating: 4.8, appointments: 7, status: 'Hoạt động' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar - (Bạn có thể tách Sidebar thành component riêng để dùng lại) */}
      <aside className="sidebar">
        {/* ... (Copy từ các file trước) */}
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-title">MedCare Admin Panel</div>
        </header>

        <div className="content-wrapper">
          <div className="page-header">
            <div className="page-title-group">
              <h1>Quản lý bác sĩ</h1>
              <p>Quản lý thông tin và lịch làm việc của các bác sĩ</p>
            </div>
            <button className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm bác sĩ
            </button>
          </div>

          <div className="controls-row">
            <div className="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" className="search-input" placeholder="Tìm kiếm bác sĩ..." />
            </div>
            <select className="filter-select">
              <option>Tất cả chuyên khoa</option>
              <option>Tim mạch</option>
              <option>Nhi khoa</option>
              <option>Da liễu</option>
            </select>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h3>Danh sách bác sĩ ({doctorsList.length})</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bác sĩ</th>
                  <th>Chuyên khoa</th>
                  <th>Đánh giá</th>
                  <th>Lịch hẹn</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {doctorsList.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doctor-info">
                        <img src={`https://ui-avatars.com/api/?name=${doc.name}&background=random`} alt="avatar" className="doctor-avatar" />
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.specialty}</td>
                    <td>
                      <div className="rating-cell">
                        <svg className="star-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {doc.rating}
                      </div>
                    </td>
                    <td>
                      <span className="appointment-count">{doc.appointments}</span>
                    </td>
                    <td>
                      <span className="status-active">{doc.status}</span>
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

export default Doctors;