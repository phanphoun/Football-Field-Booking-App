import React, { useState } from 'react'
import { Calendar, Clock, Users } from 'lucide-react'

const BookingForm = ({ field, onBookingSubmit }) => {
  const [formData, setFormData] = useState({
    field: field?.id || '',
    date: '',
    time: '',
    duration: '',
    players: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onBookingSubmit) {
      onBookingSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-group">
        <label>Select Field</label>
        <select name="field" value={formData.field} onChange={handleChange} required>
          <option value="">Choose a field...</option>
          <option value="1">Central Sports Complex</option>
          <option value="2">Riverside Football Club</option>
          <option value="3">Community Sports Center</option>
        </select>
      </div>

      <div className="form-group">
        <label>Date</label>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label>Time</label>
        <input 
          type="time" 
          name="time" 
          value={formData.time} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label>Duration (hours)</label>
        <select name="duration" value={formData.duration} onChange={handleChange} required>
          <option value="">Select duration...</option>
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
          <option value="3">3 hours</option>
        </select>
      </div>

      <div className="form-group">
        <label>Number of Players</label>
        <input 
          type="number" 
          name="players" 
          value={formData.players} 
          onChange={handleChange} 
          min="1" 
          max="22" 
          required 
        />
      </div>

      <button type="submit" className="btn btn-primary">Book Now</button>
    </form>
  )
}

export default BookingForm
