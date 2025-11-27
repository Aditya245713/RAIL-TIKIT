import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './TrainSearchResults.css';

const TrainSearchResults = () => {
  const [trains, setTrains] = useState([]);
  const [trainRoutes, setTrainRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeLoading, setRouteLoading] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const searchData = location.state?.searchData;

  useEffect(() => {
    if (!searchData) {
      navigate('/buy-tickets');
      return;
    }
    searchTrains();
  }, [searchData, navigate]);

  const searchTrains = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/search-trains-by-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_station: searchData.fromStation,
          to_station: searchData.toStation,
          journey_date: searchData.journeyDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTrains(data);
      } else {
        setError('Failed to fetch trains');
      }
    } catch (error) {
      console.error('Error searching trains:', error);
      setError('Error occurred while searching trains');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainDetails = (train) => {
    navigate('/train-details', {
      state: {
        train: train,
        searchData: searchData
      }
    });
  };

  const handleShowRoutes = async (train) => {
    const trainId = train.train_id;
    
    // If routes are already loaded for this train and visible, hide them
    if (trainRoutes[trainId]?.visible) {
      setTrainRoutes(prev => ({
        ...prev,
        [trainId]: {
          ...prev[trainId],
          visible: false
        }
      }));
      return;
    }

    // Hide all other train routes first
    setTrainRoutes(prev => {
      const updated = {};
      Object.keys(prev).forEach(id => {
        updated[id] = {
          ...prev[id],
          visible: false
        };
      });
      return updated;
    });

    // If routes are already loaded for this train, just show them
    if (trainRoutes[trainId]?.routes) {
      setTrainRoutes(prev => ({
        ...prev,
        [trainId]: {
          ...prev[trainId],
          visible: true
        }
      }));
      return;
    }

    try {
      setRouteLoading(prev => ({ ...prev, [trainId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/train-routes/${trainId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrainRoutes(prev => ({
          ...prev,
          [trainId]: {
            routes: data,
            visible: true
          }
        }));
      } else {
        alert('Failed to fetch train routes');
      }
    } catch (error) {
      console.error('Error fetching train routes:', error);
      alert('Error occurred while fetching train routes');
    } finally {
      setRouteLoading(prev => ({ ...prev, [trainId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="search-results-left">
          {/* Left half with login_bg.jpg background - empty */}
        </div>
        
        <div className="search-results-right">
          <div className="search-results-container">
            <div className="loading">Searching for trains...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-left">
        {/* Left half with login_bg.jpg background - empty */}
      </div>
      
      <div className="search-results-right">
        <div className="search-results-container">
          <div className="search-header">
            <h1>🔍 Search Results</h1>
            <div className="search-info">
              <span><strong>From:</strong> {searchData?.fromStation}</span>
              <span><strong>To:</strong> {searchData?.toStation}</span>
              <span><strong>Date:</strong> {searchData?.journeyDate}</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <Link to="/buy-tickets" className="btn btn-primary">Try Again</Link>
            </div>
          )}

          {!error && trains.length === 0 && (
            <div className="no-trains">
              <h2>No trains available</h2>
              <p>No trains found for the selected route and date.</p>
              <Link to="/buy-tickets" className="btn btn-primary">Search Again</Link>
            </div>
          )}

          {!error && trains.length > 0 && (
            <div className="trains-list">
              <h2>Available Trains ({trains.length})</h2>
              {trains.map((train, index) => (
                <div key={index} className="train-card">
                  <div className="train-card-header">
                    <div className="train-info">
                      <h3>{train.train_name}</h3>
                      <div className="train-details">
                        <span className="train-id">Train ID: {train.train_id}</span>
                        <span className="train-type">{train.train_type}</span>
                      </div>
                    </div>
                    <div className="train-actions">
                      <button
                        className="btn btn-tickets"
                        onClick={() => handleTrainDetails(train)}
                      >
                        Show Tickets
                      </button>
                      <button
                        className="btn btn-routes"
                        onClick={() => handleShowRoutes(train)}
                        disabled={routeLoading[train.train_id]}
                      >
                        {routeLoading[train.train_id] ? 'Loading...' : 
                         (trainRoutes[train.train_id]?.visible ? 'Hide Routes' : 'Show Routes')}
                      </button>
                    </div>
                  </div>
                  
                  {/* Route Display */}
                  {trainRoutes[train.train_id]?.visible && (
                    <div className="route-display">
                      <h4>Train Routes</h4>
                      {trainRoutes[train.train_id].routes.length > 0 ? (
                        trainRoutes[train.train_id].routes.map((route, routeIndex) => (
                          <div key={routeIndex} className="route-section">
                            <div className="route-info">
                              <span className="route-distance">Distance: {route.distance} km</span>
                            </div>
                            {route.stations && route.stations.length > 0 && (
                              <div className="stations-list">
                                {route.stations.map((station, stationIndex) => (
                                  <div key={stationIndex} className="station-item">
                                    <div className="station-marker">
                                      <div className="location-pin">📍</div>
                                      {stationIndex < route.stations.length - 1 && (
                                        <div className="connecting-line"></div>
                                      )}
                                    </div>
                                    <div className="station-info">
                                      <strong>{station.station_name}</strong>
                                      <div className="station-times">
                                        <span>Arrival: {station.arrival_time}</span>
                                        <span>Departure: {station.departure_time}</span>
                                        <span>Halt: {station.halt_time} min</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-routes">
                          <p>No detailed route information available for this train.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="modify-search-section">
            <Link to="/buy-tickets" className="modify-search-btn">← Modify Search</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainSearchResults;
