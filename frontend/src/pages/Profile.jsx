import React from 'react'

const Profile = () => {
  return (
    <div className="profile-page">
      <div className="container">
        <h1>My Profile</h1>
        <div className="profile-content">
          <div className="profile-info">
            <h2>John Doe</h2>
            <p>Email: john.doe@example.com</p>
            <p>Phone: +1234567890</p>
          </div>
          <div className="profile-bookings">
            <h3>My Bookings</h3>
            <div className="booking-list">
              <div className="booking-item">
                <h4>Central Sports Complex</h4>
                <p>Date: March 15, 2024</p>
                <p>Time: 18:00 - 20:00</p>
                <span className="status confirmed">Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
