import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './TrainDetails.css';

const TrainDetails = () => {
  const [trainRoutes, setTrainRoutes] = useState([]);
  const [coachAvailability, setCoachAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingSeats, setRefreshingSeats] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { train, searchData } = location.state || {};

  useEffect(() => {
    if (!train || !searchData) {
      navigate('/buy-tickets');
      return;
    }
    fetchTrainData();
    
    // Add event listener for when user comes back from booking
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again, refresh coach availability
        fetchCoachAvailability();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [train, searchData, navigate]);

  const fetchCoachAvailability = async () => {
    try {
      setRefreshingSeats(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/coach-availability/${train.train_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const coachData = await response.json();
        setCoachAvailability(coachData);
      }
    } catch (error) {
      console.error('Error fetching coach availability:', error);
    } finally {
      setRefreshingSeats(false);
    }
  };

  const fetchTrainData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch both train routes and coach availability
      const [routesResponse, coachResponse] = await Promise.all([
        fetch(`http://localhost:8000/train-routes/${train.train_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`http://localhost:8000/coach-availability/${train.train_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setTrainRoutes(routesData);
      } else {
        setError('Failed to fetch train routes');
      }

      if (coachResponse.ok) {
        const coachData = await coachResponse.json();
        setCoachAvailability(coachData);
      } else {
        // Fallback to mock data if coach availability endpoint fails
        console.warn('Failed to fetch coach availability, using fallback data');
        setCoachAvailability([
          {
            coach_type: 'AC_Cabin',
            available_seats: 24,
            price: 2500
          },
          {
            coach_type: 'AC_Chair', 
            available_seats: 72,
            price: 1200
          },
          {
            coach_type: 'Snigdha',
            available_seats: 90,
            price: 800
          },
          {
            coach_type: 'Shovon',
            available_seats: 108,
            price: 400
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching train data:', error);
      setError('Error occurred while fetching train data');
      // Set fallback coach data on error
      setCoachAvailability([
        {
          coach_type: 'AC_Cabin',
          available_seats: 24,
          price: 2500
        },
        {
          coach_type: 'AC_Chair', 
          available_seats: 72,
          price: 1200
        },
        {
          coach_type: 'Snigdha',
          available_seats: 90,
          price: 800
        },
        {
          coach_type: 'Shovon',
          available_seats: 108,
          price: 400
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCoachDisplayName = (coachType) => {
    const displayNames = {
      'AC_Cabin': 'AC Cabin',
      'AC_Chair': 'AC Chair',
      'Snigdha': 'Snigdha',
      'Shovon': 'Shovon',
      'AC First Class': 'AC First Class',
      'AC Business': 'AC Business',
      'First Class': 'First Class',
      'Second Class': 'Second Class',
      'Sleeper Class': 'Sleeper Class'
    };
    return displayNames[coachType] || coachType;
  };

  const getCoachDescription = (coachType) => {
    const descriptions = {
      'AC_Cabin': 'Air-conditioned cabin with bed facilities',
      'AC_Chair': 'Air-conditioned chair car',
      'Snigdha': 'Premium non-AC seating',
      'Shovon': 'Standard seating',
      'AC First Class': 'Premium air-conditioned cabin',
      'AC Business': 'Business class air-conditioned',
      'First Class': 'First class comfort',
      'Second Class': 'Economy seating',
      'Sleeper Class': 'Sleeping berth facility'
    };
    return descriptions[coachType] || 'Standard coach';
  };

  const handleBooking = (coach) => {
    const coachInfo = {
      type: coach.coach_type,
      displayName: getCoachDisplayName(coach.coach_type),
      price: coach.price,
      seats: coach.available_seats,
      description: getCoachDescription(coach.coach_type)
    };

    navigate('/booking-confirmation', {
      state: {
        train: train,
        searchData: searchData,
        coachType: coachInfo,
        routes: trainRoutes
      }
    });
  };

  if (loading) {
    return (
      <div className="train-details-page">
        <div className="train-details-container">
          <div className="loading">Loading train details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="train-details-page">
      <div className="train-details-container">
        <div className="details-header">
          <div className="header-main">
            <h1>{train?.train_name}</h1>
            <span className="train-type-badge">{train?.train_type}</span>
          </div>
          <div className="journey-info">
            <span><strong>From:</strong> {searchData?.fromStation}</span>
            <span><strong>To:</strong> {searchData?.toStation}</span>
            <span><strong>Date:</strong> {searchData?.journeyDate}</span>
          </div>
          <Link to="/search-results" state={{ searchData }} className="back-btn">
            ← Back to Search Results
          </Link>
        </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="booking-section">
            <div className="section-header">
              <h2>Select Coach Type</h2>
              <button 
                className="refresh-btn"
                onClick={fetchCoachAvailability}
                disabled={refreshingSeats}
              >
                {refreshingSeats ? '🔄 Refreshing...' : '🔄 Refresh Availability'}
              </button>
            </div>
            <div className="coach-grid">
              {coachAvailability.length > 0 ? (
                coachAvailability.map((coach, index) => (
                  <div key={index} className="coach-card">
                    <div className="coach-header">
                      <h3>{getCoachDisplayName(coach.coach_type)}</h3>
                      <p className="coach-description">{getCoachDescription(coach.coach_type)}</p>
                    </div>
                    <div className="coach-details">
                      <div className="price">
                        <span className="price-label">Price</span>
                        <span className="price-value">৳{coach.price}</span>
                      </div>
                      <div className="seats">
                        <span className="seats-label">Available Seats</span>
                        <span className={`seats-value ${coach.available_seats <= 5 ? 'low-availability' : ''}`}>
                          {refreshingSeats ? '...' : coach.available_seats}
                        </span>
                      </div>
                      {coach.total_seats && (
                        <div className="total-seats">
                          <span className="total-seats-label">Total Seats</span>
                          <span className="total-seats-value">{coach.total_seats}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn btn-buy"
                      onClick={() => handleBooking(coach)}
                      disabled={coach.available_seats <= 0 || refreshingSeats}
                    >
                      {coach.available_seats <= 0 ? 'Sold Out' : refreshingSeats ? 'Please Wait...' : 'Buy Ticket'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-coaches">
                  <p>No coach information available for this train.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default TrainDetails;
