import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Book Your Perfect Football Field</h1>
          <p>Find and reserve the best football fields in your area</p>
          <div className="hero-buttons">
            <Link to="/fields" className="btn btn-primary">Browse Fields</Link>
            <Link to="/booking" className="btn btn-secondary">Quick Booking</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose FieldBooking?</h2>
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
  )
}

export default Home
