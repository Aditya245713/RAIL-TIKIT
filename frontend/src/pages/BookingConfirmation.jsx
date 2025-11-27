import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './BookingConfirmation.css';

const BookingConfirmation = () => {
  const [ticketCount, setTicketCount] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [bookingTime, setBookingTime] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { train, searchData, coachType, routes } = location.state || {};

  if (!train || !searchData || !coachType) {
    navigate('/buy-tickets');
    return null;
  }

  const totalPrice = coachType.price * ticketCount;

  const handleConfirmTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create booking entry
      const bookingData = {
        train_id: train.train_id,
        from_station: searchData.fromStation,
        to_station: searchData.toStation,
        journey_date: searchData.journeyDate,
        coach_type: coachType.type,
        ticket_count: ticketCount,
        total_amount: totalPrice
      };

      const response = await fetch('http://localhost:8000/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = await response.json();
        setBookingId(result.booking_id);
        setBookingTime(new Date().toLocaleString());
        setIsConfirmed(true);
        
        // Update the available seats count by fetching fresh data
        try {
          const refreshResponse = await fetch('http://localhost:8000/refresh-coach-availability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ train_id: train.train_id })
          });
          
          if (refreshResponse.ok) {
            const updatedCoaches = await refreshResponse.json();
            // Find the updated availability for the current coach type
            const updatedCoach = updatedCoaches.find(c => c.coach_type === coachType.type);
            if (updatedCoach) {
              // Update the coachType with new available seats count
              coachType.seats = updatedCoach.available_seats;
            }
          }
        } catch (refreshError) {
          console.warn('Failed to refresh seat availability:', refreshError);
          // Continue anyway - booking was successful
        }
        
        alert(`Ticket has been confirmed successfully!\nBooking ID: ${result.booking_id}` +
              (result.allocated_seats ? `\nAllocated Seats: ${result.allocated_seats.map(s => s.seat_number).join(', ')}` : ''));
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to confirm ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming ticket:', error);
      alert('Error occurred while confirming ticket. Please try again.');
    }
  };

  const handleDownloadTicket = async (format = 'html') => {
    if (!isConfirmed) {
      alert('Please confirm your ticket first before downloading.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create payment entry
      const paymentData = {
        booking_id: bookingId,
        amount: totalPrice,
        payment_method: 'online'
      };

      const response = await fetch('http://localhost:8000/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        if (format === 'html') {
          generateTicketPDF();
        } else {
          downloadTextTicket();
        }
      } else {
        alert('Failed to process payment. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error occurred while processing payment. Please try again.');
    }
  };

  const generateTicketPDF = () => {
    // Create ticket content as HTML
    const ticketContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Railway E-Ticket</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .ticket { border: 2px solid #333; padding: 20px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .total-row { border-top: 2px solid #333; margin-top: 20px; padding-top: 10px; font-weight: bold; font-size: 18px; }
        .footer { text-align: center; margin-top: 20px; border-top: 1px solid #333; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <h1>🚆 Rail Tikit</h1>
            <h2>E-Ticket</h2>
        </div>
        
        <div class="content">
            <div class="row">
                <span><strong>Booking ID:</strong></span>
                <span>${bookingId}</span>
            </div>
            <div class="row">
                <span><strong>Train:</strong></span>
                <span>${train.train_name}</span>
            </div>
            <div class="row">
                <span><strong>Route:</strong></span>
                <span>${searchData.fromStation} → ${searchData.toStation}</span>
            </div>
            <div class="row">
                <span><strong>Journey Date:</strong></span>
                <span>${searchData.journeyDate}</span>
            </div>
            <div class="row">
                <span><strong>Booking Time:</strong></span>
                <span>${bookingTime}</span>
            </div>
            <div class="row">
                <span><strong>Coach Type:</strong></span>
                <span>${coachType.displayName}</span>
            </div>
            <div class="row">
                <span><strong>Number of Tickets:</strong></span>
                <span>${ticketCount}</span>
            </div>
            <div class="row">
                <span><strong>Price per Ticket:</strong></span>
                <span>৳${coachType.price}</span>
            </div>
            <div class="row total-row">
                <span><strong>Total Amount Paid:</strong></span>
                <span><strong>৳${totalPrice}</strong></span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for choosing Rail Tikit!</strong></p>
            <p>Please arrive 30 minutes before departure time.</p>
            <p>Keep this ticket safe for your journey.</p>
        </div>
    </div>
</body>
</html>`;

    // Create a blob with the HTML content
    const blob = new Blob([ticketContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Railway_Ticket_${bookingId}.html`;
    downloadLink.style.display = 'none';
    
    // Add link to DOM, click it, then remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
    
    // Navigate to My Tickets
    alert('Ticket downloaded successfully! Check your Downloads folder.');
    navigate('/my-tickets');
  };

  const downloadTextTicket = () => {
    // Create ticket content as plain text
    const ticketText = `
========================================
    RAIL TIKIT E-TICKET
========================================

Booking ID: ${bookingId}
Train: ${train.train_name}
Route: ${searchData.fromStation} → ${searchData.toStation}
Journey Date: ${searchData.journeyDate}
Booking Time: ${bookingTime}
Coach Type: ${coachType.displayName}
Number of Tickets: ${ticketCount}
Price per Ticket: ৳${coachType.price}
Total Amount Paid: ৳${totalPrice}

========================================
Thank you for choosing Rail Tikit!
Please arrive 30 minutes before departure time.
Keep this ticket safe for your journey.
========================================
`;

    // Create a blob with the text content
    const blob = new Blob([ticketText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Railway_Ticket_${bookingId}.txt`;
    downloadLink.style.display = 'none';
    
    // Add link to DOM, click it, then remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
    
    // Navigate to My Tickets
    alert('Ticket downloaded successfully! Check your Downloads folder.');
    navigate('/my-tickets');
  };

  return (
    <div className="booking-confirmation-page">
      <div className="booking-confirmation-left">
        {/* Left half with login_bg.jpg background - empty */}
      </div>
      
      <div className="booking-confirmation-right">
        <div className="booking-confirmation-container">
          <div className="confirmation-header">
            <h1>✅ Booking Confirmation</h1>
            <Link to="/train-details" state={{ train, searchData }} className="back-btn">
              ← Back to Train Details
            </Link>
          </div>

        <div className="ticket-info-section">
          <h2>Ticket Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Train Details</h3>
              <div className="detail-row">
                <span>Train Name:</span>
                <span>{train.train_name}</span>
              </div>
              <div className="detail-row">
                <span>Train Type:</span>
                <span>{train.train_type}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Journey Details</h3>
              <div className="detail-row">
                <span>From:</span>
                <span>{searchData.fromStation}</span>
              </div>
              <div className="detail-row">
                <span>To:</span>
                <span>{searchData.toStation}</span>
              </div>
              <div className="detail-row">
                <span>Date:</span>
                <span>{searchData.journeyDate}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Coach Information</h3>
              <div className="detail-row">
                <span>Coach Type:</span>
                <span>{coachType.displayName}</span>
              </div>
              <div className="detail-row">
                <span>Price per Ticket:</span>
                <span>৳{coachType.price}</span>
              </div>
              <div className="detail-row">
                <span>Available Seats:</span>
                <span>{coachType.seats}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Booking Details</h3>
              <div className="detail-row">
                <span>Booking ID:</span>
                <span>{bookingId || 'Not confirmed yet'}</span>
              </div>
              <div className="detail-row">
                <span>Booking Time:</span>
                <span>{bookingTime || 'Not confirmed yet'}</span>
              </div>
              <div className="detail-row">
                <span>Number of Tickets:</span>
                <span>{ticketCount}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span>{isConfirmed ? 'Confirmed' : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {!isConfirmed && (
          <div className="ticket-selection">
            <h2>Select Number of Tickets</h2>
            <div className="ticket-counter">
              <label htmlFor="ticketCount">Number of Tickets:</label>
              <div className="counter-controls">
                <button 
                  className="counter-btn"
                  onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                  disabled={ticketCount <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  id="ticketCount"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                />
                <button 
                  className="counter-btn"
                  onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                  disabled={ticketCount >= 10}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="total-section">
              <h3>Total Amount: ৳{totalPrice}</h3>
            </div>

            <div className="action-buttons">
              <button 
                className="confirm-btn"
                onClick={handleConfirmTicket}
              >
                Confirm Ticket
              </button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="download-section">
            <h2>Download Your Ticket</h2>
            <div className="download-buttons">
              <button 
                className="download-btn html-btn"
                onClick={() => handleDownloadTicket('html')}
              >
                Download HTML Ticket
              </button>
              <button 
                className="download-btn text-btn"
                onClick={() => handleDownloadTicket('text')}
              >
                Download Text Ticket
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
