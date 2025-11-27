import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/home">
            <h2>🚂 Rail Tikit</h2>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          <Link 
            to="/train-info" 
            className={`sidebar-link ${isActive('/train-info') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="sidebar-icon">🚆</span>
            Train Info
          </Link>
          
          <Link 
            to="/verify-ticket" 
            className={`sidebar-link ${isActive('/verify-ticket') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="sidebar-icon">✅</span>
            Verify Ticket
          </Link>
          
          <Link 
            to="/purchase-instructions" 
            className={`sidebar-link ${isActive('/purchase-instructions') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="sidebar-icon">📋</span>
            Purchase Instructions
          </Link>
          
          <Link 
            to="/terms-conditions" 
            className={`sidebar-link ${isActive('/terms-conditions') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="sidebar-icon">📜</span>
            Terms & Conditions
          </Link>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  )
}

export default Sidebar
