import React, { useState } from 'react'
import { User, Lock, Mail } from 'lucide-react'

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onLogin) {
      onLogin(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <button type="submit" className="btn btn-primary">Login</button>
    </form>
  )
}

export default LoginForm
