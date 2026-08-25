import schedule from 'node-schedule'

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

let deps = {}
let scheduledJobs = []
let midnightJob = null

export function initPrayer(injectedDeps = {}) {
  deps = injectedDeps
}

export function triggerPrayerInterrupt(prayerName, durationMin) {
  try {
    deps.getTimerControls?.().pause()
  } catch {}

  const mainWindow = deps.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio:stop-lofi')
  }

  deps.showLockscreen?.('prayer', { prayerName, durationMin })
}

export function resumeAfterPrayer() {
  deps.hideLockscreen?.()

  try {
    deps.getTimerControls?.().resume()
  } catch {}

  const mainWindow = deps.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audio:resume-lofi')
  }
}

function todayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function fetchPrayerTimes(city, country = 'ID') {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Aladhan API error: ${res.status}`)
  }
  const data = await res.json()
  return data.data.timings
}

export async function getPrayerTimes(city, country = 'ID') {
  const dateKey = todayKey()
  let cachedDate = null
  let cachedTimings = null
  try {
    cachedDate = deps.store?.get('prayerTimes.date') ?? null
    cachedTimings = deps.store?.get('prayerTimes.timings') ?? null
  } catch {}

  if (cachedDate === dateKey && cachedTimings) {
    return cachedTimings
  }

  try {
    const timings = await fetchPrayerTimes(city, country)
    try {
      deps.store?.set('prayerTimes.date', dateKey)
      deps.store?.set('prayerTimes.timings', timings)
    } catch {}
    return timings
  } catch {
    return cachedTimings || null
  }
}

export function cancelPrayerSchedules() {
  scheduledJobs.forEach((job) => {
    try {
      job.cancel()
    } catch {}
  })
  scheduledJobs = []
  if (midnightJob) {
    try {
      midnightJob.cancel()
    } catch {}
    midnightJob = null
  }
}

function parseTimeToToday(timeString) {
  const match = /(\d{1,2}):(\d{2})/.exec(String(timeString || ''))
  if (!match) return null
  const when = new Date()
  when.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0)
  return when
}

export function schedulePrayerAlerts(timings, { durationMin = 10 } = {}, callback) {
  cancelPrayerSchedules()
  if (!timings) return []

  const now = new Date()

  PRAYER_NAMES.forEach((prayerName) => {
    const when = parseTimeToToday(timings[prayerName])
    if (!when || when <= now) return
    const job = schedule.scheduleJob(when, () => {
      try {
        callback?.({ prayerName, durationMin })
      } catch {}
    })
    if (job) scheduledJobs.push(job)
  })

  const midnight = new Date(now)
  midnight.setDate(midnight.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  midnightJob = schedule.scheduleJob(midnight, async () => {
    const city = deps.getCity ? deps.getCity() : 'Jakarta'
    const freshTimings = await getPrayerTimes(city)
    schedulePrayerAlerts(freshTimings, { durationMin }, callback)
  })

  return scheduledJobs
}
