/**
 * Translates API payloads into the shapes the screens already render.
 *
 * The UI works with calendar-date strings ("2026-04-02") and string ids, while
 * the API speaks ISO datetimes and integers — everything is normalised here so
 * no page has to care.
 */

const COST_SYMBOL = { Low: '$', Medium: '$$', High: '$$$' }

export const toDay = (value) => (value ? String(value).slice(0, 10) : '')
export const toNum = (value) => (value === null || value === undefined ? 0 : Number(value))
const str = (value) => (value === null || value === undefined ? '' : String(value))

export function adaptCity(city) {
  return {
    id: str(city.id),
    name: city.cityName,
    country: city.country,
    countryCode: city.countryCode,
    cost: COST_SYMBOL[city.costIndex] || '$$',
    tag: city.topCategory || 'Explore',
    stay: city.suggestedStay || '2-3 days',
    imageUrl: city.imageUrl || null,
    description: city.description || '',
    activityCount: city.activityCount ?? 0,
  }
}

export function adaptActivity(activity) {
  return {
    id: str(activity.id),
    name: activity.activityName,
    city: str(activity.cityId),
    cityName: activity.cityName || '',
    country: activity.country || '',
    category: activity.categoryName || 'Other',
    cost: toNum(activity.estimatedCost),
    duration: activity.estimatedDuration ?? 0,
    rating: activity.rating ?? 0,
    reviews: activity.reviewCount ?? 0,
    imageUrl: activity.imageUrl || null,
    bookingUrl: activity.bookingUrl || null,
    isPopular: !!activity.isPopular,
  }
}

/** One scheduled item inside a stop. */
function adaptScheduledActivity(row) {
  const catalog = row.activity || {}
  return {
    id: str(row.id),
    activityId: str(row.activityId),
    name: catalog.activityName || 'Activity',
    cost: toNum(row.actualCost ?? catalog.estimatedCost),
    category: catalog.category?.categoryName || 'Other',
    date: toDay(row.scheduledDate),
    startTime: row.scheduledStartTime || '',
    endTime: row.scheduledEndTime || '',
    status: row.status || 'planned',
    duration: catalog.estimatedDuration ?? 0,
    bookingUrl: catalog.bookingUrl || null,
  }
}

/** A stop becomes a "section" in the itinerary builder. */
function adaptStop(stop) {
  return {
    id: str(stop.id),
    cityId: str(stop.cityId),
    cityName: stop.city?.cityName || '',
    country: stop.city?.country || '',
    // The builder calls these "sections" and titles them; we keep that text in
    // the stop's notes column.
    title: stop.notes || stop.city?.cityName || 'Stop',
    startDate: toDay(stop.startDate),
    endDate: toDay(stop.endDate),
    stopSequence: stop.stopSequence,
    accommodationBudget: stop.accommodationBudget === null ? null : toNum(stop.accommodationBudget),
    activities: (stop.activities || []).map(adaptScheduledActivity),
  }
}

export function adaptBudget(budget) {
  if (!budget) return null
  return {
    accommodationBudget: budget.accommodationBudget === null ? null : toNum(budget.accommodationBudget),
    activitiesBudget: budget.activitiesBudget === null ? null : toNum(budget.activitiesBudget),
    foodBudget: budget.foodBudget === null ? null : toNum(budget.foodBudget),
    transportationBudget: budget.transportationBudget === null ? null : toNum(budget.transportationBudget),
    miscellaneousBudget: budget.miscellaneousBudget === null ? null : toNum(budget.miscellaneousBudget),
    totalBudget: budget.totalBudget === null ? null : toNum(budget.totalBudget),
    actualActivitiesSpend: toNum(budget.actualActivitiesSpend),
    plannedActivitiesSpend: toNum(budget.plannedActivitiesSpend),
  }
}

export function adaptTrip(trip) {
  return {
    id: str(trip.id),
    name: trip.tripName,
    description: trip.description || '',
    startDate: toDay(trip.startDate),
    endDate: toDay(trip.endDate),
    budget: toNum(trip.totalBudget),
    currency: trip.currency || 'USD',
    coverImageUrl: trip.coverImageUrl || null,
    isPublic: !!trip.isPublic,
    publicUrlSlug: trip.publicUrlSlug || null,
    viewCount: trip.viewCount ?? 0,
    createdAt: trip.createdAt ? new Date(trip.createdAt).getTime() : 0,
    budgetBreakdown: adaptBudget(trip.budget),
    shareSlug: trip.shares?.[0]?.shareUrlSlug || trip.publicUrlSlug || null,
    sections: (trip.stops || []).map(adaptStop),
  }
}

/** The read-only payload behind a public share link. */
export function adaptPublicTrip(trip) {
  return {
    ...adaptTrip(trip),
    owner: trip.user
      ? {
          firstName: trip.user.firstName,
          lastName: trip.user.lastName,
          profilePictureUrl: trip.user.profilePictureUrl || null,
        }
      : null,
  }
}

export function adaptUser(user) {
  if (!user) return null
  return {
    id: str(user.id),
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    city: user.city || '',
    country: user.country || '',
    bio: user.bio || '',
    profilePictureUrl: user.profilePictureUrl || null,
    currency: user.preferredCurrency || 'USD',
    authProvider: user.authProvider || 'LOCAL',
    isVerified: !!user.isVerified,
    isPremium: !!user.isPremium,
    tripCount: user.tripCount ?? null,
    tripLimit: user.tripLimit === undefined ? null : user.tripLimit,
    // The header and profile card fall back to this when no name is set.
    username: user.email ? user.email.split('@')[0] : '',
  }
}
