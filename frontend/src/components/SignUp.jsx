import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignUp.css'

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordMatch, setPasswordMatch] = useState(true)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Check password match when either password field changes
    if (name === 'password' || name === 'confirmPassword') {
      const password = name === 'password' ? value : formData.password
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword
      setPasswordMatch(password === confirmPassword || confirmPassword === '')
    }
    
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check and try again.')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      // Don't send confirmPassword to backend
      const { confirmPassword, ...dataToSend } = formData
      
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! You can now login.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(data.detail || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-left-section">
        {/* Background image will be applied via CSS */}
      </div>
      
      <div className="signup-right-section">
        <div className="signup-form-wrapper">
          <h2>Sign Up for Rail Tikit</h2>
          
          <form onSubmit={handleSubmit} className="signup-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone No.:</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password (min. 6 characters)"
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                disabled={loading}
                className={!passwordMatch ? 'password-mismatch' : ''}
              />
              {!passwordMatch && formData.confirmPassword && (
                <small className="password-error">Passwords do not match</small>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !passwordMatch || !formData.password || !formData.confirmPassword}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="login-prompt">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>

          <div className="back-to-home">
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
