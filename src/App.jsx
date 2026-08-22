import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './store/AppContext'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import CreateTrip from './pages/CreateTrip'
import BuildItinerary from './pages/BuildItinerary'
import MyTrips from './pages/MyTrips'
import Search from './pages/Search'
import TripView from './pages/TripView'
import Profile from './pages/Profile'

function Protected({ children }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function Home() {
  const { currentUser } = useApp()
  return currentUser ? <Landing /> : <Welcome />
}

export default function App() {
  const { currentUser } = useApp()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />

        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Protected><MyTrips /></Protected>} />
        <Route path="/trips/new" element={<Protected><CreateTrip /></Protected>} />
        <Route path="/trips/:tripId/builder" element={<Protected><BuildItinerary /></Protected>} />
        <Route path="/trips/:tripId" element={<Protected><TripView /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="*" element={<Navigate to={currentUser ? '/' : '/login'} replace />} />
      </Routes>
      <Toast />
    </div>
  )
}
