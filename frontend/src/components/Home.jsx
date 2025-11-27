import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTransition } from '../contexts/TransitionContext'
import './Home.css'

function Home() {
  // Animated welcome title and subtitles
  const [titleVisible, setTitleVisible] = useState(false)
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1)
  const subtitles = [
    "Your go-to railway service platform",
    "Your safety & comfort is our utmost concern",
    "Our services are available 24/7"
  ]

  useEffect(() => {
    const titleTimer = setTimeout(() => {
      setTitleVisible(true)
    }, 500)

    const subtitleTimer = setTimeout(() => {
      setCurrentSubtitleIndex(0)
    }, 2000)

    const intervalTimer = setInterval(() => {
      setCurrentSubtitleIndex(prevIndex => {
        if (prevIndex < subtitles.length - 1) {
          return prevIndex + 1
        }
        return 0
      })
    }, 5000)

    return () => {
      clearTimeout(titleTimer)
      clearTimeout(subtitleTimer)
      clearInterval(intervalTimer)
    }
  }, [])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyTicketsOpen, setBuyTicketsOpen] = useState(false)
  const [trainInfoOpen, setTrainInfoOpen] = useState(false)
  const [trainSearchTerm, setTrainSearchTerm] = useState('')
  const [isTrainDropdownOpen, setIsTrainDropdownOpen] = useState(false)
  const [verifyTicketOpen, setVerifyTicketOpen] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState(null)
  const [fromStationSearch, setFromStationSearch] = useState('')
  const [toStationSearch, setToStationSearch] = useState('')
  const [showFromStationDropdown, setShowFromStationDropdown] = useState(false)
  const [showToStationDropdown, setShowToStationDropdown] = useState(false)
  const [searchData, setSearchData] = useState({
    fromStation: '',
    toStation: '',
    journeyDate: ''
  })
  const [stations, setStations] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const trainSearchRef = useRef(null)
  const fromStationRef = useRef(null)
  const toStationRef = useRef(null)
  const navigate = useNavigate()
  const { endTransition, isTransitioning } = useTransition()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch user info from backend
    fetch('http://localhost:8000/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      return response.json()
    })
    .then(data => {
      setUser(data)
      setLoading(false)
      // End transition if it's active
      if (isTransitioning) {
        setTimeout(() => {
          endTransition()
        }, 500) // Small delay to ensure everything is rendered
      }
    })
    .catch(error => {
      console.error('Error:', error)
      localStorage.removeItem('token')
      navigate('/login')
    })

    // Fetch stations
    fetchStations()
  }, [navigate])

  // Close train dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close train search dropdown when clicking outside search input
      if (trainSearchRef.current && !trainSearchRef.current.contains(event.target)) {
        setIsTrainDropdownOpen(false)
      }
      
      // Close entire train info dropdown when clicking outside of it
      const trainInfoDropdown = document.querySelector('.train-info-dropdown')
      const trainInfoButton = event.target.closest('[data-train-info-button]')
      
      if (trainInfoOpen && trainInfoDropdown && !trainInfoDropdown.contains(event.target) && !trainInfoButton) {
        setTrainInfoOpen(false)
        setTrainSearchTerm('')
        setIsTrainDropdownOpen(false)
      }

      // Close verify ticket dropdown when clicking outside of it
      const verifyTicketDropdown = document.querySelector('.verify-ticket-dropdown')
      const verifyTicketButton = event.target.closest('[data-verify-ticket-button]')
      
      if (verifyTicketOpen && verifyTicketDropdown && !verifyTicketDropdown.contains(event.target) && !verifyTicketButton) {
        setVerifyTicketOpen(false)
        setBookingId('')
        setVerifyError(null)
      }

      // Close station dropdowns when clicking outside
      if (fromStationRef.current && !fromStationRef.current.contains(event.target)) {
        setShowFromStationDropdown(false)
      }
      if (toStationRef.current && !toStationRef.current.contains(event.target)) {
        setShowToStationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [trainInfoOpen, verifyTicketOpen, showFromStationDropdown, showToStationDropdown])

  const fetchStations = async () => {
    try {
      const response = await fetch('http://localhost:8000/stations')
      if (response.ok) {
        const stationsData = await response.json()
        setStations(stationsData)
      } else {
        console.error('Failed to fetch stations')
        // Fallback to mock data
        setStations([
          { station_id: 1, station_name: 'Dhaka', location: 'Dhaka Division' },
          { station_id: 2, station_name: 'Chittagong', location: 'Chittagong Division' },
          { station_id: 3, station_name: 'Sylhet', location: 'Sylhet Division' },
          { station_id: 4, station_name: 'Rajshahi', location: 'Rajshahi Division' },
          { station_id: 5, station_name: 'Khulna', location: 'Khulna Division' }
        ])
      }
    } catch (error) {
      console.error('Error fetching stations:', error)
      // Fallback to mock data
      setStations([
        { station_id: 1, station_name: 'Dhaka', location: 'Dhaka Division' },
        { station_id: 2, station_name: 'Chittagong', location: 'Chittagong Division' },
        { station_id: 3, station_name: 'Sylhet', location: 'Sylhet Division' },
        { station_id: 4, station_name: 'Rajshahi', location: 'Rajshahi Division' },
        { station_id: 5, station_name: 'Khulna', location: 'Khulna Division' }
      ])
    }
  }

  const handleSearchChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    })
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchData.fromStation || !searchData.toStation || !searchData.journeyDate) {
      alert('Please fill in all required fields')
      return
    }
    if (searchData.fromStation === searchData.toStation) {
      alert('Source and destination stations cannot be the same')
      return
    }
    
    try {
      const searchRequest = {
        from_station: searchData.fromStation,
        to_station: searchData.toStation,
        journey_date: searchData.journeyDate
      }

      const response = await fetch('http://localhost:8000/search-trains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest)
      })

      if (response.ok) {
        const trainsData = await response.json()
        navigate('/search-results', { 
          state: { 
            trains: trainsData,
            searchData: searchData
          } 
        })
      } else {
        alert('Failed to search trains. Please try again.')
      }
    } catch (error) {
      console.error('Error searching trains:', error)
      alert('Error occurred while searching trains. Please try again.')
    }
  }

  const toggleBuyTickets = () => {
    setBuyTicketsOpen(!buyTicketsOpen)
  }

  const closeBuyTickets = () => {
    setBuyTicketsOpen(false)
    setShowFromStationDropdown(false)
    setShowToStationDropdown(false)
  }

  // Train Info functionality
  const trains = [
    'Parabat Express',
    'Padma Express',
    'Sirajganj Express',
    'Sonar Bangla Express',
    'Sundarban Express',
    'Mohanagar Express',
    'Panchagarh Express',
    'Rangpur Express',
    'Benapole Express',
    'CoxsBazar Express',
    'Jamalpur Express',
    'Chilahati Express',
    'Madhumati Express',
    'Narayanganj Commuter',
    'Lalmonirhat Commuter',
    'Rajshahi Commuter'
  ]

  const filteredTrains = trains.filter(train =>
    train.toLowerCase().includes(trainSearchTerm.toLowerCase())
  )

  const toggleTrainInfo = () => {
    setTrainInfoOpen(!trainInfoOpen)
    setTrainSearchTerm('')
    setIsTrainDropdownOpen(false)
  }

  const closeTrainInfo = () => {
    setTrainInfoOpen(false)
    setTrainSearchTerm('')
    setIsTrainDropdownOpen(false)
  }

  const handleTrainSearchChange = (e) => {
    setTrainSearchTerm(e.target.value)
    setIsTrainDropdownOpen(true)
  }

  const handleTrainSelect = async (trainName) => {
    setTrainSearchTerm(trainName)
    setIsTrainDropdownOpen(false)
    
    try {
      // Navigate to train info page with the selected train
      navigate('/train-info', { 
        state: { 
          selectedTrain: trainName,
          autoLoad: true
        } 
      })
    } catch (error) {
      console.error('Error navigating to train info:', error)
    }
  }

  const handleTrainSearchFocus = () => {
    setIsTrainDropdownOpen(true)
  }

  // Verify Ticket functionality
  const toggleVerifyTicket = () => {
    setVerifyTicketOpen(!verifyTicketOpen)
    setBookingId('')
    setVerifyError(null)
  }

  const closeVerifyTicket = () => {
    setVerifyTicketOpen(false)
    setBookingId('')
    setVerifyError(null)
  }

  const handleVerifyTicket = async (e) => {
    e.preventDefault()
    
    if (!bookingId.trim()) {
      setVerifyError('Please enter a booking ID')
      return
    }

    if (!bookingId.trim().match(/^\d+$/)) {
      setVerifyError('Please enter a valid booking ID (numbers only)')
      return
    }

    try {
      setVerifyLoading(true)
      setVerifyError(null)

      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/verify-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId.trim()
        })
      })

      if (response.ok) {
        const ticketDetails = await response.json()
        // Navigate to verify ticket page with the ticket details
        navigate('/verify-ticket', { 
          state: { 
            ticketDetails: ticketDetails
          } 
        })
      } else {
        const errorData = await response.json()
        if (response.status === 404) {
          setVerifyError('Invalid ticket - No ticket found with this booking ID')
        } else {
          setVerifyError(errorData.detail || 'Failed to verify ticket')
        }
      }
    } catch (error) {
      console.error('Error verifying ticket:', error)
      setVerifyError('Error occurred while verifying ticket. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  // Station search functionality
  const handleFromStationChange = (e) => {
    setFromStationSearch(e.target.value)
    setSearchData({
      ...searchData,
      fromStation: e.target.value
    })
    setShowFromStationDropdown(true)
  }

  const handleToStationChange = (e) => {
    setToStationSearch(e.target.value)
    setSearchData({
      ...searchData,
      toStation: e.target.value
    })
    setShowToStationDropdown(true)
  }

  const handleFromStationSelect = (stationName) => {
    setFromStationSearch(stationName)
    setSearchData({
      ...searchData,
      fromStation: stationName
    })
    setShowFromStationDropdown(false)
  }

  const handleToStationSelect = (stationName) => {
    setToStationSearch(stationName)
    setSearchData({
      ...searchData,
      toStation: stationName
    })
    setShowToStationDropdown(false)
  }

  const filteredFromStations = stations.filter(station =>
    station.station_name.toLowerCase().includes(fromStationSearch.toLowerCase()) &&
    station.station_name !== searchData.toStation
  )

  const filteredToStations = stations.filter(station =>
    station.station_name.toLowerCase().includes(toStationSearch.toLowerCase()) &&
    station.station_name !== searchData.fromStation
  )

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="home-page">
      {/* Top Half - Dark Background */}
      <div className="home-top-half">
        <header className="home-header">
          <div className="container">
            <h1 className="site-title">Rail Tikit</h1>
            <nav className="header-nav">
              <button onClick={toggleBuyTickets} className="nav-item nav-button">
                Buy Tickets
              </button>
              <Link to="/my-tickets" className="nav-item">
                My Tickets
              </Link>
              <button 
                onClick={toggleTrainInfo} 
                className="nav-item nav-button"
                data-train-info-button
              >
                Train Info
              </button>
              <button 
                onClick={toggleVerifyTicket} 
                className="nav-item nav-button"
                data-verify-ticket-button
              >
                Verify Ticket
              </button>
            </nav>
            <div className="header-icons">
              <Link to="/profile" className="profile-icon">
                <span>👤</span>
              </Link>
            </div>
          </div>

          {/* Train Info Dropdown Bar */}
          <div className={`train-info-dropdown ${trainInfoOpen ? 'show' : ''}`}>
            <div className="train-search-input-wrapper">
              <input
                type="text"
                className="train-search-input"
                placeholder="Search for a train"
                value={trainSearchTerm}
                onChange={handleTrainSearchChange}
                onFocus={handleTrainSearchFocus}
              />
              <div className="train-search-icon">🔍</div>
            </div>

            {isTrainDropdownOpen && (
              <div className="train-search-dropdown">
                {filteredTrains.length > 0 ? (
                  filteredTrains.map((train, index) => (
                    <div
                      key={index}
                      className="train-dropdown-item"
                      onClick={() => handleTrainSelect(train)}
                    >
                      🚂 {train}
                    </div>
                  ))
                ) : (
                  <div className="train-dropdown-item no-results">
                    No trains found matching "{trainSearchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verify Ticket Dropdown Bar */}
          <div className={`verify-ticket-dropdown ${verifyTicketOpen ? 'show' : ''}`}>
            <form onSubmit={handleVerifyTicket} className="verify-ticket-form">
              <div className="verify-ticket-input-wrapper">
                <input
                  type="text"
                  className="verify-ticket-input"
                  placeholder="Enter booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  disabled={verifyLoading}
                />
                <button 
                  type="submit" 
                  className="verify-ticket-btn"
                  disabled={verifyLoading || !bookingId.trim()}
                >
                  {verifyLoading ? '🔄' : 'Verify'}
                </button>
              </div>
              
              {verifyError && (
                <div className="verify-error-message">
                  {verifyError}
                </div>
              )}
            </form>
          </div>
        </header>

        {/* Animated Welcome Title and Subtitles - moved outside overlays and header */}
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

        <main className="home-main">
          <div className="container">
            {/* Main content area - now clean */}
          </div>
        </main>
      </div>

      {/* Buy Tickets Dropdown */}
      <div className={`buy-tickets-backdrop ${buyTicketsOpen ? 'active' : ''}`} onClick={closeBuyTickets}></div>
      <div className={`buy-tickets-dropdown ${buyTicketsOpen ? 'active' : ''}`}>
        <div className="dropdown-header">
          <h3>🎫 Book Your Journey</h3>
          <button className="close-dropdown" onClick={closeBuyTickets}>×</button>
        </div>
        <form onSubmit={handleSearch} className="dropdown-search-form">
          <div className="dropdown-search-grid">
            <div className="dropdown-form-group">
              <label htmlFor="dropdownFromStation">From Station</label>
              <div className="station-search-wrapper" ref={fromStationRef}>
                <input
                  type="text"
                  id="dropdownFromStation"
                  name="fromStation"
                  value={fromStationSearch}
                  onChange={handleFromStationChange}
                  onFocus={() => setShowFromStationDropdown(true)}
                  placeholder="Type or select departure station"
                  required
                />
                {showFromStationDropdown && (
                  <div className="station-dropdown">
                    {filteredFromStations.length > 0 ? (
                      filteredFromStations.map((station) => (
                        <div
                          key={station.station_id}
                          className="station-dropdown-item"
                          onClick={() => handleFromStationSelect(station.station_name)}
                        >
                          🚉 {station.station_name}
                        </div>
                      ))
                    ) : (
                      <div className="station-dropdown-item no-results">
                        No stations found matching "{fromStationSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="dropdown-form-group">
              <label htmlFor="dropdownToStation">To Station</label>
              <div className="station-search-wrapper" ref={toStationRef}>
                <input
                  type="text"
                  id="dropdownToStation"
                  name="toStation"
                  value={toStationSearch}
                  onChange={handleToStationChange}
                  onFocus={() => setShowToStationDropdown(true)}
                  placeholder="Type or select destination station"
                  required
                />
                {showToStationDropdown && (
                  <div className="station-dropdown">
                    {filteredToStations.length > 0 ? (
                      filteredToStations.map((station) => (
                        <div
                          key={station.station_id}
                          className="station-dropdown-item"
                          onClick={() => handleToStationSelect(station.station_name)}
                        >
                          🚉 {station.station_name}
                        </div>
                      ))
                    ) : (
                      <div className="station-dropdown-item no-results">
                        No stations found matching "{toStationSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="dropdown-form-group">
              <label htmlFor="dropdownJourneyDate">Journey Date</label>
              <input
                type="date"
                id="dropdownJourneyDate"
                name="journeyDate"
                value={searchData.journeyDate}
                onChange={handleSearchChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="dropdown-button-container">
            <button type="submit" className="btn-search-dropdown">
              🔍 Search Trains
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Home
