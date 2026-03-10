import './Dashboard.css';

function FieldOwnerDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Field Owner Dashboard</h1>
        <p>Welcome, Field Owner!</p>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>My Fields</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-number">$0</p>
          </div>
        </div>

        <div className="action-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Add New Field</button>
            <button className="action-btn">Manage Bookings</button>
            <button className="action-btn">View Schedule</button>
          </div>
        </div>

        <div className="info-section">
          <h2>Recent Bookings</h2>
          <p className="empty-state">No recent bookings. Add a field to start receiving bookings!</p>
        </div>
      </div>
    </div>
  );
}

export default FieldOwnerDashboard;

