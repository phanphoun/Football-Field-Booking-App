import React, { useState } from 'react'
import { User, Lock, Mail } from 'lucide-react'

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (onRegister) {
      onRegister(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Full Name</label>
        <div className="input-group">
          <User size={20} />
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Enter your full name"
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Email</label>
        <div className="input-group">
          <Mail size={20} />
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Enter your email"
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="input-group">
          <Lock size={20} />
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="Enter your password"
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <div className="input-group">
          <Lock size={20} />
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            placeholder="Confirm your password"
            required 
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">Register</button>
    </form>
  )
}

export default RegisterForm
