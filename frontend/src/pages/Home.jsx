import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'

const Home = () => {
  return (
    <>
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Book Your Perfect Football Field</h1>
          {/* <p>Find and reserve the best football fields in your area</p> */}
          <div className="hero-buttons">
            <Link to="/fields" className="btn btn-primary">Browse Fields</Link>
            <Link to="/booking" className="btn btn-secondary">Quick Booking</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className = "reason-title">Why Choose FieldBooking?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <MapPin size={48} />
              <h3>Find Nearby Fields</h3>
              <p>Discover football fields in your location with detailed information</p>
            </div>
            <div className="feature-card">
              <Calendar size={48} />
              <h3>Easy Booking</h3>
              <p>Reserve your preferred time slot with just a few clicks</p>
            </div>
            <div className="feature-card">
              <Clock size={48} />
              <h3>Real-time Availability</h3>
              <p>Check live availability and book instantly</p>
            </div>
            <div className="feature-card">
              <Users size={48} />
              <h3>Team Management</h3>
              <p>Organize your team and manage bookings together</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div className='popular-fields'>
      <div className="container">
        <h2 className="section-title">Popular Fields</h2>
        <div className="fields-grid">
          <div className="field-card">
            <div className="field-image">
              <img src="https://img.freepik.com/free-photo/neon-style-american-football-player_23-2151827390.jpg?semt=ais_hybrid&w=740&q=80" alt="Football Field" />
              <div className="field-badge">Popular</div>
            </div>
            <div className="field-content">
              <h3>Phnom Penh Stadium</h3>
              <div className="field-info">
                <span className="location">📍 Phnom Penh</span>
                <span className="price">$25/hour</span>
              </div>
              <div className="field-stats">
                <span>⭐ 4.8 (124 reviews)</span>
                <span>🏃 85% booked</span>
              </div>
              <div className="field-features">
                <span className="feature">⚽ Standard</span>
                <span className="feature">🚿 Shower</span>
                <span className="feature">🅿️ Parking</span>
              </div>
              <button className="btn btn-primary field-btn">View Details</button>
            </div>
          </div>

          <div className="field-card">
            <div className="field-image">
              <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=250&fit=crop" alt="Football Field" />
              <div className="field-badge">Premium</div>
            </div>
            <div className="field-content">
              <h3>Sihanoukville Sports Complex</h3>
              <div className="field-info">
                <span className="location">📍 Sihanoukville</span>
                <span className="price">$35/hour</span>
              </div>
              <div className="field-stats">
                <span>⭐ 4.9 (89 reviews)</span>
                <span>🏃 92% booked</span>
              </div>
              <div className="field-features">
                <span className="feature">⚽ Premium</span>
                <span className="feature">🚿 Shower</span>
                <span className="feature">🅿️ Parking</span>
                <span className="feature">🏥 Medical</span>
              </div>
              <button className="btn btn-primary field-btn">View Details</button>
            </div>
          </div>

          <div className="field-card">
            <div className="field-image">
              <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop" alt="Football Field" />
              <div className="field-badge">New</div>
            </div>
            <div className="field-content">
              <h3>Siem Reap Arena</h3>
              <div className="field-info">
                <span className="location">📍 Siem Reap</span>
                <span className="price">$20/hour</span>
              </div>
              <div className="field-stats">
                <span>⭐ 4.7 (45 reviews)</span>
                <span>🏃 78% booked</span>
              </div>
              <div className="field-features">
                <span className="feature">⚽ Standard</span>
                <span className="feature">🚿 Shower</span>
                <span className="feature">💡 Lights</span>
              </div>
              <button className="btn btn-primary field-btn">View Details</button>
            </div>
          </div>
        </div>
        <div className="view-all-container">
          <Link to="/fields" className="btn btn-secondary">View All Fields</Link>
        </div>
      </div>
    </div>
    </>
  )
}

export default Home
