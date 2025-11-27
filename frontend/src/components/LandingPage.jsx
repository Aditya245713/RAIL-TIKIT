import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import railIcon from '../assets/images/rail_icon.png'
import farhanImage from '../assets/images/farhan.jfif'
import shafahidImage from '../assets/images/shafahid.jfif'
import './LandingPage.css'

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1)

  const subtitles = [
    "Your go-to railway service platform",
    "Your safety & comfort is our utmost concern", 
    "Our services are available 24/7"
  ]

  useEffect(() => {
    // Show title first
    const titleTimer = setTimeout(() => {
      setTitleVisible(true)
    }, 500)

    // Start showing subtitles after title appears
    const subtitleTimer = setTimeout(() => {
      setCurrentSubtitleIndex(0)
    }, 2000)

    // Cycle through remaining subtitles every 5 seconds
    const intervalTimer = setInterval(() => {
      setCurrentSubtitleIndex(prevIndex => {
        if (prevIndex < subtitles.length - 1) {
          return prevIndex + 1
        }
        return 0 // Loop back to first subtitle
      })
    }, 5000)

    return () => {
      clearTimeout(titleTimer)
      clearTimeout(subtitleTimer)
      clearInterval(intervalTimer)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const openAboutModal = () => {
    setIsAboutModalOpen(true)
    closeMenu() // Close menu when opening modal
  }

  const closeAboutModal = () => {
    setIsAboutModalOpen(false)
  }

  return (
    <div className="landing-page">
      <div className="hero-section">
        {/* Hamburger Icon */}
        <div className="hamburger-container">
          <button 
            className={`hamburger ${isMenuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Backdrop */}
        <div 
          className={`menu-backdrop ${isMenuOpen ? 'active' : ''}`}
          onClick={closeMenu}
        ></div>

        {/* Side Drawer Menu */}
        <div className={`menu-overlay ${isMenuOpen ? 'active' : ''}`}>
          <div className="menu-content">
            <h2 className="menu-title">Rail Tikit</h2>
            
            <div className="menu-buttons">
              <Link to="/login" className="menu-btn" onClick={closeMenu}>Login</Link>
              <Link to="/signup" className="menu-btn" onClick={closeMenu}>Sign Up</Link>
              <button className="menu-btn about-btn" onClick={openAboutModal}>About Us</button>
            </div>
            
            <div className="menu-footer">
              <p>&copy; 2025 Rail Tikit. All rights reserved.</p>
            </div>
          </div>
        </div>

        <div className="welcome-container">
          <h1 className={`welcome-title ${titleVisible ? 'visible' : ''}`}>Welcome to Rail Tikit</h1>
          <div className="subtitle-container">
            {subtitles.map((subtitle, index) => (
              <p 
                key={index}
                className={`welcome-subtitle ${index === currentSubtitleIndex ? 'active' : ''}`}
              >
                {subtitle}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* About Us Modal */}
      {isAboutModalOpen && (
        <div className="about-modal-backdrop" onClick={closeAboutModal}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>About Our Team</h2>
              <button className="modal-close-btn" onClick={closeAboutModal}>×</button>
            </div>
            
            <div className="team-cards-container">
              <div className="team-card">
                <div className="team-member-info">
                  <img 
                    src={farhanImage} 
                    alt="Farhan Bin Rabbani Profile" 
                    className="team-member-avatar"
                    onError={(e) => {
                      e.target.src = railIcon // Fallback to rail icon if image fails to load
                    }}
                  />
                  <div className="team-member-details">
                    <h3>Farhan Bin Rabbani</h3>
                    <p>farhan@example.com</p>
                  </div>
                </div>
              </div>
              
              <div className="team-card">
                <div className="team-member-info">
                  <img 
                    src={shafahidImage} 
                    alt="Chowdhury Shafahid Rahman Profile" 
                    className="team-member-avatar"
                    onError={(e) => {
                      e.target.src = railIcon // Fallback to rail icon if image fails to load
                    }}
                  />
                  <div className="team-member-details">
                    <h3>Chowdhury Shafahid Rahman</h3>
                    <p>shafahid@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
