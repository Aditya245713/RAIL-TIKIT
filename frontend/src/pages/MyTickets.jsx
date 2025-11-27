import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyTickets.css';

const MyTickets = () => {
  const [tickets, setTickets] = useState({ upcoming_trips: [], past_trips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/my-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tickets data:', data); // Debug log
        setTickets(data);
      } else {
        console.error('Failed to fetch tickets, status:', response.status);
        setError('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Error occurred while fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-tickets-page">
        <div className="my-tickets-left">
          {/* Left half with login_bg.jpg background - empty */}
        </div>
        
        <div className="my-tickets-right">
          <div className="my-tickets-container">
            <div className="loading">Loading your tickets...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-tickets-page">
      <div className="my-tickets-left">
        {/* Left half with login_bg.jpg background - empty */}
      </div>
      
      <div className="my-tickets-right">
        <div className="my-tickets-container">
          <div className="tickets-header">
            <h1>🎫 My Tickets</h1>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="tickets-section">
            <div className="section-card">
              <h2>🚀 Upcoming Trips</h2>
              {tickets.upcoming_trips.length > 0 ? (
                <div className="trips-grid">
                  {tickets.upcoming_trips.map((ticket, index) => (
                    <div key={index} className="ticket-card upcoming">
                      <div className="ticket-header">
                        <h3>Booking ID: {ticket.booking_id}</h3>
                        <span className={`status ${ticket.status}`}>{ticket.status}</span>
                      </div>
                      <div className="ticket-details">
                        <div className="detail-row">
                          <span>Train:</span>
                          <span>{ticket.train_name}</span>
                        </div>
                        <div className="detail-row">
                          <span>Route:</span>
                          <span>{ticket.from_station} → {ticket.to_station}</span>
                        </div>
                        <div className="detail-row">
                          <span>Journey Date:</span>
                          <span>{ticket.journey_date}</span>
                        </div>
                        <div className="detail-row">
                          <span>Coach Type:</span>
                          <span>{ticket.coach_type}</span>
                        </div>
                        <div className="detail-row">
                          <span>Tickets:</span>
                          <span>{ticket.ticket_count}</span>
                        </div>
                        <div className="detail-row total">
                          <span>Total Amount:</span>
                          <span>৳{ticket.total_amount}</span>
                        </div>
                      </div>
                      <div className="ticket-footer">
                        <small>Booked on: {ticket.booking_date}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You don't have any upcoming trips</p>
                </div>
              )}
            </div>

            <div className="section-card">
              <h2>📚 Past Trips</h2>
              {tickets.past_trips.length > 0 ? (
                <div className="trips-grid">
                  {tickets.past_trips.map((ticket, index) => (
                    <div key={index} className="ticket-card past">
                      <div className="ticket-header">
                        <h3>Booking ID: {ticket.booking_id}</h3>
                        <span className={`status ${ticket.status}`}>{ticket.status}</span>
                      </div>
                      <div className="ticket-details">
                        <div className="detail-row">
                          <span>Train:</span>
                          <span>{ticket.train_name}</span>
                        </div>
                        <div className="detail-row">
                          <span>Route:</span>
                          <span>{ticket.from_station} → {ticket.to_station}</span>
                        </div>
                        <div className="detail-row">
                          <span>Journey Date:</span>
                          <span>{ticket.journey_date}</span>
                        </div>
                        <div className="detail-row">
                          <span>Coach Type:</span>
                          <span>{ticket.coach_type}</span>
                        </div>
                        <div className="detail-row">
                          <span>Tickets:</span>
                          <span>{ticket.ticket_count}</span>
                        </div>
                        <div className="detail-row total">
                          <span>Total Amount:</span>
                          <span>৳{ticket.total_amount}</span>
                        </div>
                      </div>
                      <div className="ticket-footer">
                        <small>Booked on: {ticket.booking_date}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You don't have any past trips</p>
                </div>
              )}

              <div className="book-new-ticket-inside">
                <Link to="/buy-tickets" className="book-new-ticket-btn">← Book New Ticket</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
