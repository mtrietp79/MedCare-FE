import React from 'react';
import './Finance.css';
import './Dashboard.css'; // Kế thừa layout sidebar chung

const Finance: React.FC = () => {
  const transactions = [
    { id: 1, date: '2024-04-15', desc: 'Thanh toán khám bệnh - Nguyễn Văn A', type: 'Doanh thu', method: 'Thẻ tín dụng', amount: '+500.000 đ', status: 'Hoàn thành' },
    { id: 2, date: '2024-04-15', desc: 'Mua thiết bị y tế', type: 'Chi phí', method: 'Chuyển khoản', amount: '-2.500.000 đ', status: 'Hoàn thành' },
    { id: 3, date: '2024-04-14', desc: 'Thanh toán lương nhân viên tháng 4', type: 'Chi phí', method: 'Chuyển khoản', amount: '-45.000.000 đ', status: 'Hoàn thành' },
    { id: 4, date: '2024-04-14', desc: 'Thanh toán khám bệnh - Phạm Thị B', type: 'Doanh thu', method: 'Ví điện tử', amount: '+750.000 đ', status: 'Hoàn thành' },
    { id: 5, date: '2024-04-13', desc: 'Tiền điện, nước tháng 4', type: 'Chi phí', method: 'Chuyển khoản', amount: '-5.000.000 đ', status: 'Chờ xử lý' },
    { id: 6, date: '2024-04-13', desc: 'Doanh thu từ dịch vụ VIP', type: 'Doanh thu', method: 'Tiền mặt', amount: '+15.000.000 đ', status: 'Hoàn thành' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar - Active at 'Tài chính' */}
      <aside className="sidebar">
        {/* ... (Phần code Sidebar giống các trang trước, set active cho Tài chính) */}
      </aside>

      <main className="main-content">
        <header className="top-header">
           <div className="header-title">MedCare Admin Panel</div>
        </header>

        <div className="content-wrapper">
          <div className="finance-header">
            <div className="page-title-group">
              <h1>Quản lý tài chính</h1>
              <p>Theo dõi doanh thu, chi phí và các giao dịch tài chính</p>
            </div>
            <button className="btn-export">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Xuất báo cáo
            </button>
          </div>

          {/* Stats Grid */}
          <div className="finance-grid">
            <div className="finance-card">
              <div className="card-top">
                <span>Doanh thu tháng này</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="card-value">450.50M đ</div>
              <div className="card-trend">
                <span className="trend-up">↗ +12.5%</span> So với tháng trước
              </div>
            </div>

            <div className="finance-card">
              <div className="card-top">
                <span>Chi phí hoạt động</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              </div>
              <div className="card-value">125.30M đ</div>
              <div className="card-trend">
                <span className="trend-down">↘ -2.3%</span> So với tháng trước
              </div>
            </div>

            <div className="finance-card">
              <div className="card-top">
                <span>Lợi nhuận ròng</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <div className="card-value">325.20M đ</div>
              <div className="card-trend">
                <span className="trend-up">↗ +18.7%</span> So với tháng trước
              </div>
            </div>

            <div className="finance-card">
              <div className="card-top">
                <span>Thanh toán nợ</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 16 2 2 4-4"></path><path d="m3 10 2 2 4-4"></path><line x1="13" y1="6" x2="21" y2="6"></line><line x1="13" y1="12" x2="21" y2="12"></line><line x1="13" y1="18" x2="21" y2="18"></line></svg>
              </div>
              <div className="card-value">15.80M đ</div>
              <div className="card-trend">
                <span className="trend-down">↘ +5.2%</span> So với tháng trước
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="table-container">
            <div className="table-controls">
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Giao dịch gần đây</h2>
              <div className="filter-group">
                <select className="select-filter"><option>Tháng này</option></select>
                <select className="select-filter"><option>Tất cả</option></select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Mô tả</th>
                  <th>Loại</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: '#6b7280' }}>{t.date}</td>
                    <td style={{ fontWeight: 500 }}>{t.desc}</td>
                    <td>
                      <span className={`type-badge ${t.type === 'Doanh thu' ? 'type-income' : 'type-expense'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td>{t.method}</td>
                    <td>
                      <span className={t.amount.startsWith('+') ? 'amount-positive' : 'amount-negative'}>
                        {t.amount}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === 'Hoàn thành' ? 'status-completed' : 'status-pending'}`}>
                        {t.status}
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

export default Finance;