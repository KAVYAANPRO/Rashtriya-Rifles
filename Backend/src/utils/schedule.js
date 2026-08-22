/**
 * Turns a loose list of AI-proposed activities into a real timetable:
 * every item gets a start and end time, the day runs in order, and nothing
 * overlaps. The model is asked for good times, but never trusted to give them.
 */

const DAY_START = 8 * 60; // 08:00
const DAY_END = 23 * 60 + 30; // 23:30
const DEFAULT_DURATION = 90; // minutes
const GAP = 15; // minutes of travel/breathing room between items

/** "09:30" | "9:30" | "09:30:00" -> minutes since midnight, or null. */
function parseTime(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** minutes since midnight -> "09:30" (clamped to a single day). */
function formatTime(minutes) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function durationMinutes(activity) {
  const fromHours = Number(activity.durationHours);
  if (Number.isFinite(fromHours) && fromHours > 0) {
    return Math.min(12 * 60, Math.round(fromHours * 60));
  }

  // Some replies give explicit end times instead of a duration.
  const start = parseTime(activity.startTime);
  const end = parseTime(activity.endTime);
  if (start !== null && end !== null && end > start) return end - start;

  return DEFAULT_DURATION;
}

/**
 * Lays one day out on a timeline.
 *
 * Items keep the order the model intended (by proposed start time, falling
 * back to array order), then each is pushed forward just enough that it starts
 * after the previous one finishes.
 */
function buildDaySchedule(activities) {
  const prepared = activities.map((activity, index) => ({
    activity,
    index,
    proposedStart: parseTime(activity.startTime),
    duration: durationMinutes(activity),
  }));

  prepared.sort((a, b) => {
    if (a.proposedStart === null && b.proposedStart === null) return a.index - b.index;
    if (a.proposedStart === null) return 1; // untimed items go last
    if (b.proposedStart === null) return -1;
    if (a.proposedStart !== b.proposedStart) return a.proposedStart - b.proposedStart;
    return a.index - b.index;
  });

  const scheduled = [];
  const overflow = [];
  let cursor = DAY_START;

  const MIN_SLOT = 30; // don't bother scheduling anything shorter than this

  for (const item of prepared) {
    // Never start before the previous item ends — an overlapping timetable is
    // worse than a shorter one.
    const start = item.proposedStart === null
      ? cursor
      : Math.max(item.proposedStart, cursor);

    if (start + MIN_SLOT > DAY_END) {
      // The day is genuinely full. Report it rather than squeezing it in.
      overflow.push(item.activity);
      continue;
    }

    const end = Math.min(DAY_END, start + item.duration);

    scheduled.push({
      ...item.activity,
      startTime: formatTime(start),
      endTime: formatTime(end),
      durationMinutes: end - start,
    });

    cursor = end + GAP;
  }

  return { scheduled, overflow };
}

module.exports = { parseTime, formatTime, durationMinutes, buildDaySchedule, DAY_START, DAY_END };
