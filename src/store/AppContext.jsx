import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import { adaptActivity, adaptCity, adaptTrip, adaptUser } from '../lib/adapt'

const AppContext = createContext(null)

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Turns any thrown value into the { ok, error } shape the forms expect. */
function fail(err) {
  return { ok: false, error: err?.message || 'Something went wrong.', code: err?.code, status: err?.status }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const [trips, setTrips] = useState([])
  const [tripsLoading, setTripsLoading] = useState(false)
  // False until the first fetch settles. Pages that resolve a trip from the
  // URL must wait for this, or a refresh on /trips/:id bounces to the list
  // before the data has had a chance to arrive.
  const [tripsLoaded, setTripsLoaded] = useState(false)

  const [cities, setCities] = useState([])
  const [activities, setActivities] = useState([])
  const [categories, setCategories] = useState([])
  const [catalogReady, setCatalogReady] = useState(false)

  const [toast, setToast] = useState(null)

  const notify = useCallback((message, kind = 'info') => {
    setToast({ message, kind, key: uid('toast') })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  /* ── catalog ────────────────────────────────────────────────────── */

  useEffect(() => {
    let alive = true
    Promise.all([api.catalog.cities(), api.catalog.activities(), api.catalog.categories()])
      .then(([c, a, cat]) => {
        if (!alive) return
        setCities(c.map(adaptCity))
        setActivities(a.map(adaptActivity))
        setCategories(cat.map((x) => x.categoryName))
      })
      .catch(() => {
        /* the pages fall back to empty lists and show their empty states */
      })
      .finally(() => alive && setCatalogReady(true))
    return () => { alive = false }
  }, [])

  const cityById = useCallback((id) => cities.find((c) => c.id === String(id)) || null, [cities])
  const activitiesByCity = useCallback(
    (id) => activities.filter((a) => a.city === String(id)),
    [activities],
  )

  /* ── trips ──────────────────────────────────────────────────────── */

  const loadTrips = useCallback(async () => {
    setTripsLoading(true)
    try {
      const data = await api.trips.list()
      setTrips(data.map(adaptTrip))
    } catch (err) {
      if (err?.status !== 401) notify(err.message, 'error')
      setTrips([])
    } finally {
      setTripsLoading(false)
      setTripsLoaded(true)
    }
  }, [notify])

  /** Re-reads one trip from the server and swaps it into the list. */
  const reloadTrip = useCallback(async (tripId) => {
    try {
      const fresh = adaptTrip(await api.trips.get(tripId))
      setTrips((all) => {
        const idx = all.findIndex((t) => t.id === fresh.id)
        if (idx === -1) return [...all, fresh]
        const next = [...all]
        next[idx] = fresh
        return next
      })
      return fresh
    } catch (err) {
      notify(err.message, 'error')
      return null
    }
  }, [notify])

  /* ── session ────────────────────────────────────────────────────── */

  const refreshUser = useCallback(async () => {
    try {
      const me = adaptUser(await api.auth.me())
      setCurrentUser(me)
      return me
    } catch {
      api.setToken(null)
      setCurrentUser(null)
      return null
    }
  }, [])

  // Restore the session on boot.
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true

    if (!api.getToken()) {
      setAuthReady(true)
      return
    }
    refreshUser().finally(() => setAuthReady(true))
  }, [refreshUser])

  // Whenever we have a user (and only then) keep their trips in sync.
  useEffect(() => {
    if (!currentUser) {
      setTrips([])
      setTripsLoaded(false)
      return
    }
    loadTrips()
  }, [currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = useCallback(async ({ token, user }) => {
    api.setToken(token)
    setCurrentUser(adaptUser(user))
    // The login payload has no trip counts — pull the full profile so the
    // Premium card and trip limit are right straight away.
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await api.auth.login({ email: email.trim(), password })
      await startSession(data)
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [startSession])

  const register = useCallback(async (data) => {
    try {
      const result = await api.auth.register({
        email: (data.email || '').trim(),
        password: data.password,
        firstName: (data.firstName || '').trim(),
        lastName: (data.lastName || '').trim(),
        phone: data.phone || '',
        city: data.city || '',
        country: data.country || '',
        bio: data.bio || '',
      })
      return { ok: true, email: result.email, requiresVerification: true }
    } catch (err) {
      return fail(err)
    }
  }, [])

  const verifyEmail = useCallback(async ({ email, code }) => {
    try {
      const data = await api.auth.verifyEmail({ email: email.trim(), code: code.trim() })
      if (data.token) await startSession(data)
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [startSession])

  const resendOtp = useCallback(async (email, type = 'EMAIL_VERIFICATION') => {
    try {
      await api.auth.resendOtp({ email: email.trim(), type })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [])

  const forgotPassword = useCallback(async (email) => {
    try {
      await api.auth.forgotPassword(email.trim())
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [])

  const resetPassword = useCallback(async ({ email, code, newPassword }) => {
    try {
      await api.auth.resetPassword({ email: email.trim(), code: code.trim(), newPassword })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [])

  const googleLogin = useCallback(async (idToken) => {
    try {
      const data = await api.auth.googleLogin(idToken)
      await startSession(data)
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }, [startSession])

  const logout = useCallback(() => {
    api.setToken(null)
    setCurrentUser(null)
    setTrips([])
    setTripsLoaded(false)
  }, [])

  const updateProfile = useCallback(async (patch) => {
    try {
      const updated = adaptUser(await api.auth.updateMe(patch))
      setCurrentUser((u) => ({ ...u, ...updated }))
      notify('Profile updated.', 'success')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify])

  /* ── trip mutations ─────────────────────────────────────────────── */

  const userTrips = trips

  const createTrip = useCallback(async (data) => {
    try {
      const created = await api.trips.create({
        tripName: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        totalBudget: Number(data.budget) || 0,
        currency: data.currency || 'USD',
      })

      // The starting city becomes the first stop, matching the form's promise.
      if (data.cityId) {
        await api.stops.add(created.id, {
          cityId: Number(data.cityId),
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.cityLabel || 'Arrival',
        })
      }

      const trip = await reloadTrip(created.id)
      notify('Trip created.', 'success')
      return { ok: true, trip }
    } catch (err) {
      return fail(err)
    }
  }, [notify, reloadTrip])

  const deleteTrip = useCallback(async (tripId) => {
    try {
      await api.trips.remove(tripId)
      setTrips((all) => all.filter((t) => t.id !== String(tripId)))
      notify('Trip deleted.', 'info')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify])

  const updateTripDetails = useCallback(async (tripId, patch) => {
    try {
      await api.trips.update(tripId, patch)
      await reloadTrip(tripId)
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const getTrip = useCallback((tripId) => trips.find((t) => t.id === String(tripId)) || null, [trips])

  const addSection = useCallback(async (tripId, section) => {
    try {
      await api.stops.add(tripId, {
        cityId: Number(section.cityId),
        startDate: section.startDate,
        endDate: section.endDate,
        notes: section.title,
      })
      await reloadTrip(tripId)
      notify('Section added.', 'success')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const updateSection = useCallback(async (tripId, sectionId, patch) => {
    try {
      await api.stops.update(tripId, sectionId, {
        ...(patch.cityId !== undefined ? { cityId: Number(patch.cityId) } : {}),
        ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
        ...(patch.endDate !== undefined ? { endDate: patch.endDate } : {}),
        ...(patch.title !== undefined ? { notes: patch.title } : {}),
      })
      await reloadTrip(tripId)
      notify('Section updated.', 'success')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const removeSection = useCallback(async (tripId, sectionId) => {
    try {
      await api.stops.remove(tripId, sectionId)
      await reloadTrip(tripId)
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const addActivityToSection = useCallback(async (tripId, sectionId, activity) => {
    try {
      await api.tripActivities.add(tripId, sectionId, {
        activityId: Number(activity.activityId),
        scheduledDate: activity.date,
        ...(activity.cost !== undefined && activity.cost !== null
          ? { actualCost: Number(activity.cost) }
          : {}),
      })
      await reloadTrip(tripId)
      notify(`Added "${activity.name}" to itinerary.`, 'success')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const updateActivityInSection = useCallback(async (tripId, sectionId, activityRowId, patch) => {
    try {
      await api.tripActivities.update(tripId, sectionId, activityRowId, patch)
      await reloadTrip(tripId)
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const removeActivityFromSection = useCallback(async (tripId, sectionId, activityRowId) => {
    try {
      await api.tripActivities.remove(tripId, sectionId, activityRowId)
      await reloadTrip(tripId)
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const isActivityInTrip = useCallback((tripId, activityId) => {
    const t = trips.find((x) => x.id === String(tripId))
    if (!t) return false
    return t.sections.some((s) => s.activities.some((a) => a.activityId === String(activityId)))
  }, [trips])

  const tripSpend = useCallback(
    (trip) =>
      (trip?.sections || []).reduce(
        (sum, s) => sum + s.activities.reduce((acc, a) => acc + (Number(a.cost) || 0), 0),
        0,
      ),
    [],
  )

  /* ── budget ─────────────────────────────────────────────────────── */

  const saveBudget = useCallback(async (tripId, values) => {
    try {
      await api.budget.save(tripId, values)
      await reloadTrip(tripId)
      notify('Budget saved.', 'success')
      return { ok: true }
    } catch (err) {
      notify(err.message, 'error')
      return fail(err)
    }
  }, [notify, reloadTrip])

  const value = useMemo(() => ({
    // session
    currentUser, authReady, refreshUser, startSession,
    login, register, verifyEmail, resendOtp, forgotPassword, resetPassword, googleLogin,
    logout, updateProfile,

    // trips
    trips, userTrips, tripsLoading, tripsLoaded, loadTrips, reloadTrip,
    createTrip, deleteTrip, updateTripDetails, getTrip,
    addSection, updateSection, removeSection,
    addActivityToSection, updateActivityInSection, removeActivityFromSection,
    isActivityInTrip, tripSpend, saveBudget,

    // catalog
    cities, activities, categories, catalogReady, cityById, activitiesByCity,

    // ui
    toast, notify,
  }), [
    currentUser, authReady, refreshUser, startSession,
    login, register, verifyEmail, resendOtp, forgotPassword, resetPassword, googleLogin,
    logout, updateProfile,
    trips, userTrips, tripsLoading, tripsLoaded, loadTrips, reloadTrip,
    createTrip, deleteTrip, updateTripDetails, getTrip,
    addSection, updateSection, removeSection,
    addActivityToSection, updateActivityInSection, removeActivityFromSection,
    isActivityInTrip, tripSpend, saveBudget,
    cities, activities, categories, catalogReady, cityById, activitiesByCity,
    toast, notify,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
