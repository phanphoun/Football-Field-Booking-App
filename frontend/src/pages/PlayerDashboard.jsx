import './Dashboard.css';

function PlayerDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Player Dashboard</h1>
        <p>Welcome, Player!</p>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>My Bookings</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Available Fields</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Favorite Fields</h3>
            <p className="stat-number">0</p>
          </div>
        </div>

        <div className="action-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">Find Fields</button>
            <button className="action-btn">My Bookings</button>
            <button className="action-btn">Book a Field</button>
          </div>
        </div>

        <div className="info-section">
          <h2>Upcoming Matches</h2>
          <p className="empty-state">No upcoming matches. Book a field to get started!</p>
        </div>
      </div>
    </div>
  );
}

export default PlayerDashboard;

