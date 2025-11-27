import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './TrainInfo.css'

function TrainInfo() {
  const [selectedTrain, setSelectedTrain] = useState(null)
  const [trainDetails, setTrainDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Handle navigation state - auto-load train if coming from home page
  useEffect(() => {
    if (location.state && location.state.selectedTrain && location.state.autoLoad) {
      const trainName = location.state.selectedTrain
      setSelectedTrain(trainName)
      setLoading(true)

      // Fetch train details automatically
      const fetchTrainDetails = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/train-info?train_name=${encodeURIComponent(trainName)}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Received train data:', data)
            console.log('Distance from API:', data.total_distance)
            setTrainDetails(data)
          } else {
            console.log('API response not OK:', response.status, response.statusText)
            // Mock data for now if API fails
            setTrainDetails({
              train_id: Math.floor(Math.random() * 100),
              train_name: trainName,
              train_type: 'Express',
              total_coaches: 12,
              route_stations: [
                { station: 'Dhaka', arrival: '08:00', departure: '08:00', halt: '0m' },
                { station: 'Comilla', arrival: '10:15', departure: '10:20', halt: '5m' },
                { station: 'Feni', arrival: '11:30', departure: '11:35', halt: '5m' },
                { station: 'Chittagong', arrival: '14:30', departure: '14:30', halt: '0m' }
              ],
              operating_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              departure_time: '08:00',
              arrival_time: '14:30',
              total_distance: '264 km',
              journey_time: '6h 30m'
            })
          }
        } catch (error) {
          console.error('Error fetching train details:', error)
          // Mock data fallback
          setTrainDetails({
            train_id: Math.floor(Math.random() * 100),
            train_name: trainName,
            train_type: 'Express',
            total_coaches: 12,
            route_stations: [
              { station: 'Dhaka', arrival: '08:00', departure: '08:00', halt: '0m' },
              { station: 'Comilla', arrival: '10:15', departure: '10:20', halt: '5m' },
              { station: 'Feni', arrival: '11:30', departure: '11:35', halt: '5m' },
              { station: 'Chittagong', arrival: '14:30', departure: '14:30', halt: '0m' }
            ],
            operating_days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            departure_time: '08:00',
            arrival_time: '14:30',
            total_distance: '264 km',
            journey_time: '6h 30m'
          })
        } finally {
          setLoading(false)
        }
      }

      fetchTrainDetails()
    }
  }, [location.state])

  return (
    <div className="train-info-page">
      <div className="train-info-left">
        {/* Left half with login_bg.jpg background - empty */}
      </div>
      
      <div className="train-info-right">
        <div className="train-info-container">
          <header className="train-info-header">
            <h1>🚂 Train Information</h1>
            <p>Detailed train information and schedules</p>
          </header>

          {loading && (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading train information...</p>
            </div>
          )}

            {trainDetails && !loading && (
              <div className="train-details-section">
                <div className="train-overview">
                  <div className="train-header">
                    <h2>{trainDetails.train_name}</h2>
                    <span className="train-type">{trainDetails.train_type}</span>
                  </div>
                  
                  <div className="train-summary">
                    <div className="summary-item">
                      <span className="label">Distance:</span>
                      <span className="value">{trainDetails.total_distance || 'N/A'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Total Coaches:</span>
                      <span className="value">{trainDetails.total_coaches}</span>
                    </div>
                  </div>
                </div>

                <div className="route-information">
                  <h3>🛤️ Route Information</h3>
                  <div className="route-timeline">
                    {trainDetails.route_stations.map((station, index) => (
                      <div key={index} className="station-item">
                        <div className="station-marker">
                          <div className="location-pin">📍</div>
                          {index < trainDetails.route_stations.length - 1 && (
                            <div className="connecting-line"></div>
                          )}
                        </div>
                        <div className="station-details">
                          <h4>{station.station}</h4>
                          <div className="station-times">
                            <span>Arrival: {station.arrival}</span>
                            <span>Departure: {station.departure}</span>
                            <span>Halt: {station.halt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="operating-schedule">
                  <h3>📅 Operating Schedule</h3>
                  <div className="schedule-info">
                    <div className="operating-days">
                      <h4>Operating Days:</h4>
                      <div className="days-list">
                        {trainDetails.operating_days.map((day, index) => {
                          const shortDay = day.substring(0, 3).toLowerCase();
                          const displayDay = shortDay.charAt(0).toUpperCase() + shortDay.slice(1);
                          return (
                            <span 
                              key={index} 
                              className={`day-chip ${day.toLowerCase() === 'friday' ? 'friday-special' : ''}`}
                            >
                              {displayDay}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="return-home">
                    <button 
                      className="return-home-btn" 
                      onClick={() => navigate('/home')}
                    >
                      ← Return to Home
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedTrain && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Search for Train Information</h3>
                <p>Use the search bar above to find detailed information about any train including routes, schedules, and more.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default TrainInfo
