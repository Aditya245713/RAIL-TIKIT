import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTransition } from '../contexts/TransitionContext'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { startTransition } = useTransition()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem('token', data.access_token)
        
        // Start transition animation and navigate
        setLoading(false)
        startTransition('Welcome aboard! Taking you to your dashboard...')
        
        // Navigate after a brief delay to allow transition to start
        setTimeout(() => {
          navigate('/home')
        }, 100)
      } else {
        setError(data.detail || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left-section">
        {/* Background image will be applied via CSS */}
      </div>
      
      <div className="login-right-section">
        <div className="login-form-wrapper">
          <h2>Login to Rail Tikit</h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
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
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="signup-prompt">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          </div>

          <div className="back-to-home">
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
