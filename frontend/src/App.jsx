import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store/AppContext'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import { PageLoader } from './components/ui'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import Landing from './pages/Landing'
import CreateTrip from './pages/CreateTrip'
import BuildItinerary from './pages/BuildItinerary'
import MyTrips from './pages/MyTrips'
import Search from './pages/Search'
import Travel from './pages/Travel'
import TripView from './pages/TripView'
import PublicTrip from './pages/PublicTrip'
import Profile from './pages/Profile'

function Protected({ children }) {
  const { currentUser, authReady } = useApp()
  if (!authReady) return <PageLoader label="Loading your account…" />
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function Home() {
  const { currentUser } = useApp()
  return currentUser ? <Landing /> : <Welcome />
}

export default function App() {
  const { currentUser, authReady } = useApp()

  if (!authReady) return <PageLoader label="Loading GlobalTrotter…" />

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-email" element={currentUser ? <Navigate to="/" replace /> : <VerifyEmail />} />
        <Route path="/forgot-password" element={currentUser ? <Navigate to="/" replace /> : <ForgotPassword />} />

        <Route path="/t/:slug" element={<PublicTrip />} />

        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Protected><MyTrips /></Protected>} />
        <Route path="/trips/new" element={<Protected><CreateTrip /></Protected>} />
        <Route path="/trips/:tripId/builder" element={<Protected><BuildItinerary /></Protected>} />
        <Route path="/trips/:tripId" element={<Protected><TripView /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/travel" element={<Protected><Travel /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="*" element={<Navigate to={currentUser ? '/' : '/login'} replace />} />
      </Routes>
      <Toast />
    </div>
  )
}
