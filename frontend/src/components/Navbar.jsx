import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, User, Menu, X } from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          ⚽ FieldBooking
        </Link>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/fields" className="nav-link">Fields</Link>
          <Link to="/booking" className="nav-link">Booking</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
        </div>

        <div className="nav-auth">
          <Link to="/login" className="nav-link login">Login</Link>
          <Link to="/register" className="nav-btn">Register</Link>
        </div>

        <button 
          className="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
