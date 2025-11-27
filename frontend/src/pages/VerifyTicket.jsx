import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './VerifyTicket.css';

const VerifyTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ticketDetails = location.state?.ticketDetails;

  const handleReset = () => {
    navigate('/home');
  };

  return (
    <div className="verify-ticket-page">
      <div className="verify-ticket-left">
        {/* Left half with login_bg.jpg background - empty */}
      </div>
      
      <div className="verify-ticket-right">
        <div className="verify-ticket-container">
          <div className="verify-header">
            <h1>🔍 Ticket Verification</h1>
          </div>

          {!ticketDetails && (
            <div className="no-ticket-message">
              <div className="empty-icon">🎫</div>
              <h2>No Ticket to Verify</h2>
              <p>Please use the "Verify Ticket" option on the home page to enter your booking ID.</p>
              <Link to="/home" className="home-btn">Go to Home</Link>
            </div>
          )}

          {ticketDetails && (
            <div className="ticket-details-section">
              <div className="ticket-card">
                <div className="ticket-header">
                  <h2>✅ Ticket Verified Successfully</h2>
                  <span className={`status-badge ${ticketDetails.status}`}>
                    {ticketDetails.status.toUpperCase()}
                  </span>
                </div>

                <div className="details-grid">
                  <div className="detail-section">
                    <h3>Booking Information</h3>
                    <div className="detail-row">
                      <span>Booking ID:</span>
                      <span className="reference-code">{ticketDetails.booking_id}</span>
                    </div>
                    <div className="detail-row">
                      <span>Booking Date:</span>
                      <span>{ticketDetails.booking_date}</span>
                    </div>
                    <div className="detail-row">
                      <span>Journey Date:</span>
                      <span>{ticketDetails.journey_date}</span>
                    </div>
                    <div className="detail-row">
                      <span>Payment Status:</span>
                      <span className={`payment-status ${ticketDetails.payment_status}`}>
                        {ticketDetails.payment_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Passenger Details</h3>
                    <div className="detail-row">
                      <span>Name:</span>
                      <span>{ticketDetails.passenger_name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Email:</span>
                      <span>{ticketDetails.passenger_email}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Journey Details</h3>
                    <div className="detail-row">
                      <span>Train:</span>
                      <span>{ticketDetails.train_name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Route:</span>
                      <span>{ticketDetails.from_station} → {ticketDetails.to_station}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Seat Information</h3>
                    {ticketDetails.seat_details.map((seat, index) => (
                      <div key={index} className="seat-info">
                        <div className="detail-row">
                          <span>Seat {index + 1}:</span>
                          <span>{seat.seat_number} ({seat.coach_type})</span>
                        </div>
                        <div className="detail-row">
                          <span>Coach:</span>
                          <span>{seat.coach_number}</span>
                        </div>
                        <div className="detail-row">
                          <span>Fare:</span>
                          <span>৳{seat.fare}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="total-section">
                  <div className="total-row">
                    <span>Total Amount:</span>
                    <span className="total-amount">৳{ticketDetails.total_amount}</span>
                  </div>
                </div>

                <div className="ticket-footer">
                  <p className="verification-note">
                    ✅ This ticket has been successfully verified against our database.
                  </p>
                  <p className="travel-note">
                    Please arrive at the station 30 minutes before departure time.
                  </p>
                </div>

                <div className="actions">
                  <button 
                    className="verify-another-btn"
                    onClick={handleReset}
                  >
                    ← Verify Another Ticket
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyTicket;
