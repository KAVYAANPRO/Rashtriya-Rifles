import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)

const LS_USERS = 'gt_users'
const LS_TRIPS = 'gt_trips'
const LS_SESSION = 'gt_session'

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function seedIfEmpty() {
  let users = load(LS_USERS, null)
  let trips = load(LS_TRIPS, null)

  if (!users) {
    users = [
      {
        id: 'u_demo',
        username: 'ananya.rao',
        password: 'travel2026',
        firstName: 'Ananya',
        lastName: 'Rao',
        email: 'ananya.rao@example.com',
        phone: '+91 98450 11234',
        city: 'Bengaluru',
        country: 'India',
        bio: 'Slow travel, faster itineraries.',
        currency: 'USD',
      },
    ]
    localStorage.setItem(LS_USERS, JSON.stringify(users))
  }

  if (!trips) {
    trips = [
      {
        id: 't_demo',
        userId: 'u_demo',
        name: 'Kansai Spring Loop',
        startDate: '2026-04-02',
        endDate: '2026-04-14',
        budget: 4850,
        currency: 'USD',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        sections: [
          {
            id: 's1',
            title: 'Kyoto arrival',
            cityId: 'kyoto',
            startDate: '2026-04-02',
            endDate: '2026-04-06',
            activities: [
              { id: 'sa1', activityId: 'a1', name: 'Fushimi Inari Hike', cost: 0, category: 'Adventure', date: '2026-04-03' },
              { id: 'sa2', activityId: 'a2', name: 'Kaiseki Tasting Menu', cost: 85, category: 'Food & Dining', date: '2026-04-04' },
            ],
          },
          {
            id: 's2',
            title: 'Osaka food loop',
            cityId: 'osaka',
            startDate: '2026-04-07',
            endDate: '2026-04-10',
            activities: [
              { id: 'sa3', activityId: 'a4', name: 'Dotonbori Street Food Crawl', cost: 45, category: 'Food & Dining', date: '2026-04-08' },
            ],
          },
        ],
      },
      {
        id: 't_past',
        userId: 'u_demo',
        name: 'Paris & the Loire Valley',
        startDate: '2025-09-12',
        endDate: '2025-09-22',
        budget: 3200,
        currency: 'USD',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 200,
        sections: [
          {
            id: 's3',
            title: 'Paris city days',
            cityId: 'paris',
            startDate: '2025-09-12',
            endDate: '2025-09-17',
            activities: [
              { id: 'sa4', activityId: 'a13', name: 'Eiffel Tower Summit', cost: 28, category: 'Culture & History', date: '2025-09-13' },
            ],
          },
        ],
      },
    ]
    localStorage.setItem(LS_TRIPS, JSON.stringify(trips))
  }

  return { users, trips }
}

export function AppProvider({ children }) {
  const seeded = useMemo(seedIfEmpty, [])
  const [users, setUsers] = useState(seeded.users)
  const [trips, setTrips] = useState(seeded.trips)
  const [sessionUserId, setSessionUserId] = useState(() => load(LS_SESSION, null))
  const [toast, setToast] = useState(null)

  useEffect(() => { localStorage.setItem(LS_USERS, JSON.stringify(users)) }, [users])
  useEffect(() => { localStorage.setItem(LS_TRIPS, JSON.stringify(trips)) }, [trips])
  useEffect(() => {
    if (sessionUserId) localStorage.setItem(LS_SESSION, JSON.stringify(sessionUserId))
    else localStorage.removeItem(LS_SESSION)
  }, [sessionUserId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (message, kind = 'info') => setToast({ message, kind, key: uid('toast') })

  const currentUser = users.find((u) => u.id === sessionUserId) || null

  const login = ({ username, password }) => {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase())
    if (!u) return { ok: false, error: 'No account with that username.' }
    if (u.password !== password) return { ok: false, error: 'Incorrect password.' }
    setSessionUserId(u.id)
    return { ok: true }
  }

  const register = (data) => {
    if (!data.username || !data.password) return { ok: false, error: 'Username and password are required.' }
    if (users.some((u) => u.username.toLowerCase() === data.username.trim().toLowerCase())) {
      return { ok: false, error: 'That username is already taken.' }
    }
    const newUser = {
      id: uid('u'),
      username: data.username.trim(),
      password: data.password,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      country: data.country || '',
      bio: data.bio || '',
      currency: 'USD',
    }
    setUsers((u) => [...u, newUser])
    setSessionUserId(newUser.id)
    return { ok: true }
  }

  const logout = () => setSessionUserId(null)

  const updateProfile = (patch) => {
    setUsers((all) => all.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u)))
    notify('Profile updated.', 'success')
  }

  const userTrips = trips.filter((t) => currentUser && t.userId === currentUser.id)

  const createTrip = (data) => {
    const trip = {
      id: uid('t'),
      userId: currentUser.id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: Number(data.budget) || 0,
      currency: data.currency || 'USD',
      createdAt: Date.now(),
      sections: data.cityId
        ? [{ id: uid('s'), title: `${data.cityLabel || 'Arrival'}`, cityId: data.cityId, startDate: data.startDate, endDate: data.endDate, activities: [] }]
        : [],
    }
    setTrips((t) => [...t, trip])
    notify('Trip created.', 'success')
    return trip
  }

  const deleteTrip = (tripId) => {
    setTrips((t) => t.filter((x) => x.id !== tripId))
    notify('Trip deleted.', 'info')
  }

  const getTrip = (tripId) => trips.find((t) => t.id === tripId) || null

  const updateTrip = (tripId, updater) => {
    setTrips((all) => all.map((t) => (t.id === tripId ? updater(t) : t)))
  }

  const addSection = (tripId, section) => {
    updateTrip(tripId, (t) => ({
      ...t,
      sections: [...t.sections, { id: uid('s'), activities: [], ...section }],
    }))
    notify('Section added.', 'success')
  }

  const removeSection = (tripId, sectionId) => {
    updateTrip(tripId, (t) => ({ ...t, sections: t.sections.filter((s) => s.id !== sectionId) }))
  }

  const addActivityToSection = (tripId, sectionId, activity) => {
    updateTrip(tripId, (t) => ({
      ...t,
      sections: t.sections.map((s) =>
        s.id === sectionId
          ? { ...s, activities: [...s.activities, { id: uid('sa'), date: s.startDate, ...activity }] }
          : s
      ),
    }))
    notify(`Added "${activity.name}" to itinerary.`, 'success')
  }

  const removeActivityFromSection = (tripId, sectionId, activityRowId) => {
    updateTrip(tripId, (t) => ({
      ...t,
      sections: t.sections.map((s) =>
        s.id === sectionId ? { ...s, activities: s.activities.filter((a) => a.id !== activityRowId) } : s
      ),
    }))
  }

  const isActivityInTrip = (tripId, activityId) => {
    const t = getTrip(tripId)
    if (!t) return false
    return t.sections.some((s) => s.activities.some((a) => a.activityId === activityId))
  }

  const tripSpend = (trip) =>
    trip.sections.reduce((sum, s) => sum + s.activities.reduce((acc, a) => acc + (Number(a.cost) || 0), 0), 0)

  const value = {
    users, currentUser, login, register, logout, updateProfile,
    trips, userTrips, createTrip, deleteTrip, getTrip, updateTrip,
    addSection, removeSection, addActivityToSection, removeActivityFromSection,
    isActivityInTrip, tripSpend,
    toast, notify,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
