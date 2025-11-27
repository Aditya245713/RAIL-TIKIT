import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { TransitionProvider } from './contexts/TransitionContext'
import TransitionLoader from './components/TransitionLoader'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import SignUp from './components/SignUp'
import AboutUs from './components/AboutUs'
import Admin from './components/Admin'
import Home from './components/Home'
import Profile from './components/Profile'
import TrainInfo from './components/TrainInfo'
import TrainSearchResults from './pages/TrainSearchResults'
import TrainDetails from './pages/TrainDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import MyTickets from './pages/MyTickets'
import VerifyTicket from './pages/VerifyTicket'

function App() {
  return (
    <TransitionProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/home" element={<Home />} />
            <Route path="/buy-tickets" element={<Navigate to="/home" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/train-info" element={<TrainInfo />} />
            <Route path="/search-results" element={<TrainSearchResults />} />
            <Route path="/train-details" element={<TrainDetails />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/verify-ticket" element={<VerifyTicket />} />
          </Routes>
          <TransitionLoader />
        </div>
      </Router>
    </TransitionProvider>
  )
}

export default App
