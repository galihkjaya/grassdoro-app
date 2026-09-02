import { app, ipcMain, Notification, shell } from 'electron'
import { PomodoroTimer } from './timer.js'
import { cancelPrayerSchedules, fetchPrayerTimes, getPrayerTimes, schedulePrayerAlerts, resumeAfterPrayer } from './prayer.js'
import { enableDND, disableDND } from './dnd.js'

import { setupScheduledSessions } from './scheduleManager.js'
import { setAutoLaunch, getAutoLaunch } from './autolaunch.js'

let timer = null
let timerStatus = 'idle'

const timerControls = {
  start: () => {},
  pause: () => {},
  resume: () => {},
  stop: () => {},
  getStatus: () => timerStatus
}

export function getTimerControls() {
  return timerControls
}

export function getActiveTimer() {
  return timer
}

function logSession(hooks, payload) {
  const store = hooks.store
  if (!store) return

  // payload: { totalFocusSeconds, sessionCount, completed }
  const history = store.get('sessionHistory', [])

  const entry = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    totalFocusSeconds: payload.totalFocusSeconds,
    sessionCount: payload.sessionCount,
    completed: payload.completed, // true if finished naturally, false if stopped early
    timestamp: Date.now()
  }

  history.push(entry)

  // Keep max 365 entries (1 year)
  if (history.length > 365) history.shift()

  store.set('sessionHistory', history)

  // Update daily focus total
  const today = entry.date
  const dailyTotal = store.get(`dailyFocus.${today}`, 0)
  store.set(`dailyFocus.${today}`, dailyTotal + payload.totalFocusSeconds)
}

function sendToAll(getWindows, channel, payload) {
  const { mainWindow, floatingWindow, lockscreenWindow } = getWindows()
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
  if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.webContents.send(channel, payload)
  if (lockscreenWindow && !lockscreenWindow.isDestroyed()) lockscreenWindow.webContents.send(channel, payload)
}

export function initializeIpc(getWindows, hooks = {}) {
  const notifyState = (status) => {
    timerStatus = status
    sendToAll(getWindows, 'timer:state', { status })
    hooks.onTimerState?.(status)
  }

  const dndEnabled = () => hooks.store?.get('dndEnabled', false) ?? false

  const applyDndForPhase = (phase) => {
    if (!dndEnabled()) return
    if (phase === 'focus') {
      enableDND()
    } else {
      disableDND()
    }
  }

  function goalProgressFor(store, totalElapsed = 0) {
    const today = new Date().toISOString().split('T')[0]
    const todayFocusSeconds = store.get(`dailyFocus.${today}`, 0) + totalElapsed
    const goalMinutes = store.get('dailyGoalMinutes', 240)
    return {
      today,
      todayFocusSeconds,
      goalProgress: Math.min(todayFocusSeconds / (goalMinutes * 60), 1.0)
    }
  }

  function checkGoalReached(hooks, progress) {
    const store = hooks.store
    if (!store) return
    if (progress.goalProgress >= 1.0 && !store.get(`goalNotified.${progress.today}`, false)) {
      store.set(`goalNotified.${progress.today}`, true)
      try {
        new Notification({
          title: '🌿 Grassdoro',
          body: 'Daily focus goal reached! Great work today.'
        }).show()
      } catch {}
    }
  }

  function createAndStart(config) {
    const { focusMin, breakMin, totalMin, longBreakMin, sessionsBeforeLongBreak } = config

    if (timer) {
      timer.stop()
    }

    timer = new PomodoroTimer({
      focusMin,
      breakMin,
      totalMin,
      longBreakMin,
      sessionsBeforeLongBreak,
      onTick: (timeLeft, phase, sessionCount) => {
        const progress = hooks.store ? goalProgressFor(hooks.store, timer.totalElapsed) : null
        if (progress) checkGoalReached(hooks, progress)
        sendToAll(getWindows, 'timer:tick', {
          timeLeft,
          phase,
          sessionCount,
          totalElapsed: timer.totalElapsed,
          totalSeconds: timer.totalSeconds,
          goalProgress: progress?.goalProgress ?? 0
        })
        hooks.onTimerTick?.(timeLeft, phase)
      },
      onPhaseChange: (phase, sessionCount) => {
        sendToAll(getWindows, 'timer:phase-change', { phase, sessionCount })
        applyDndForPhase(phase)
        hooks.onPhaseChange?.(phase)
      },
      onComplete: (sessionCount) => {
        sendToAll(getWindows, 'timer:complete', {
          totalFocusSeconds: sessionCount * (focusMin * 60),
          sessionCount
        })
        logSession(hooks, {
          totalFocusSeconds: sessionCount * (focusMin * 60),
          sessionCount,
          completed: true
        })
        if (dndEnabled()) disableDND()
        notifyState('idle')
      }
    })

    timer.start()
    applyDndForPhase('focus')
    notifyState('running')
  }

  ipcMain.handle('timer:start', (event, config) => {
    createAndStart(config)
    return { success: true }
  })

  ipcMain.handle('timer:pause', () => {
    if (timer) {
      timer.pause()
      notifyState('paused')
    }
    return { success: true }
  })

  ipcMain.handle('timer:resume', () => {
    if (timer) {
      timer.resume()
      notifyState('running')
    }
    return { success: true }
  })

  function stopActiveTimer() {
    if (!timer) return
    if (timer.totalElapsed > 0) {
      logSession(hooks, {
        totalFocusSeconds: timer.focusElapsed,
        sessionCount: timer.sessionCount,
        completed: false
      })
    }
    timer.stop()
    if (dndEnabled()) disableDND()
  }

  ipcMain.handle('timer:stop', () => {
    if (timer) {
      stopActiveTimer()
      notifyState('idle')
    }
    return { success: true }
  })

  timerControls.start = (config) => {
    if (config) createAndStart(config)
  }
  timerControls.pause = () => {
    if (timer) {
      timer.pause()
      notifyState('paused')
    }
  }
  timerControls.resume = () => {
    if (timer) {
      timer.resume()
      notifyState('running')
    }
  }
  timerControls.stop = () => {
    if (timer) {
      stopActiveTimer()
      notifyState('idle')
    }
  }
  timerControls.getStatus = () => timerStatus

  ipcMain.on('window:minimize', () => {
    const { mainWindow, floatingWindow } = getWindows()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.show()
  })

  ipcMain.on('window:close', () => {
    // Hide to tray instead of quitting — app keeps running in background
    const { mainWindow, floatingWindow } = getWindows()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.show()
  })

  ipcMain.on('window:show-main', () => {
    const { mainWindow, floatingWindow } = getWindows()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show()
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.hide()
  })

  ipcMain.on('window:show-floating', () => {
    const { floatingWindow } = getWindows()
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.show()
  })

  ipcMain.on('window:show-lockscreen', () => {
    const { lockscreenWindow } = getWindows()
    if (lockscreenWindow && !lockscreenWindow.isDestroyed()) lockscreenWindow.show()
  })

  ipcMain.on('window:hide-lockscreen', () => {
    const { lockscreenWindow } = getWindows()
    if (lockscreenWindow && !lockscreenWindow.isDestroyed()) lockscreenWindow.hide()
  })

  const defaultSettings = {
    focusMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    sessionsBeforeLongBreak: 4,
    totalMin: 120,
    musicEnabled: false,
    volume: 50,
    prayerEnabled: false,
    prayerCity: '',
    prayerDurationMin: 10,
    dndEnabled: false,
    dailyGoalHours: 4,
    autoLaunch: false
  }

  const getSettings = () => {
    const store = hooks.store
    const stored = store?.get('settings', {}) ?? {}
    return {
      ...defaultSettings,
      ...stored,
      // legacy top-level keys written by day-3 handlers
      dndEnabled: stored.dndEnabled ?? store?.get('dndEnabled', false) ?? false,
      autoLaunch: stored.autoLaunch ?? store?.get('autoLaunch', false) ?? false,
      onboardingDone: store?.get('onboardingDone', stored.onboardingDone ?? false) ?? false,
      version: app.getVersion(),
      platform: process.platform
    }
  }

  const reschedulePrayers = () => {
    const store = hooks.store
    cancelPrayerSchedules()
    if (!store?.get('settings.prayerEnabled', false)) return
    const city = store?.get('settings.prayerCity', '')
    if (!city) return
    const durationMin = store?.get('settings.prayerDurationMin', 10) ?? 10
    getPrayerTimes(city).then((timings) => {
      if (!timings) return
      schedulePrayerAlerts(timings, { durationMin }, ({ prayerName, durationMin: dur }) => {
        hooks.onPrayerTime?.({ prayerName, durationMin: dur })
      })
    }).catch(() => {})
  }

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:set', (event, { key, value }) => {
    const store = hooks.store
    store?.set(`settings.${key}`, value)

    if (key === 'autoLaunch') {
      setAutoLaunch(Boolean(value))
    } else if (key === 'dndEnabled') {
      store?.set('dndEnabled', Boolean(value))
    } else if (key === 'dailyGoalHours') {
      store?.set('dailyGoalMinutes', Math.max(1, Number(value) || 1) * 60)
    } else if (key === 'onboardingDone') {
      store?.set('onboardingDone', Boolean(value))
    } else if (['prayerEnabled', 'prayerCity', 'prayerDurationMin'].includes(key)) {
      reschedulePrayers()
    }
    return { success: true }
  })

  ipcMain.handle('shell:open-external', (event, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
    return { success: true }
  })

  ipcMain.handle('prayer:get-times', async (event, { city } = {}) => {
    if (!city) return null
    try {
      return await fetchPrayerTimes(city)
    } catch {
      return await getPrayerTimes(city)
    }
  })

  ipcMain.handle('prayer:schedule', async (event, { city, durationMin } = {}) => {
    if (!city) return { success: false }
    const timings = await getPrayerTimes(city)
    if (!timings) return { success: false }
    schedulePrayerAlerts(timings, { durationMin: durationMin || 10 }, ({ prayerName, durationMin: dur }) => {
      hooks.onPrayerTime?.({ prayerName, durationMin: dur })
    })
    return { success: true }
  })

  ipcMain.on('prayer:done', () => {
    resumeAfterPrayer()
  })

  ipcMain.handle('schedule:set', (event, scheduleConfig) => {
    hooks.store?.set('scheduleConfig', scheduleConfig)
    setupScheduledSessions(scheduleConfig)
    return { success: true }
  })

  ipcMain.handle('schedule:get', () => {
    return hooks.store?.get('scheduleConfig', []) ?? []
  })

  ipcMain.handle('goal:set', (event, goalMinutes) => {
    hooks.store?.set('dailyGoalMinutes', goalMinutes)
    return { success: true }
  })

  ipcMain.handle('goal:get', () => {
    const store = hooks.store
    if (!store) return { goalMinutes: 240, todayFocusSeconds: 0 }
    const goalMinutes = store.get('dailyGoalMinutes', 240) // default 4 hours
    const today = new Date().toISOString().split('T')[0]
    const todayFocusSeconds = store.get(`dailyFocus.${today}`, 0)
    return { goalMinutes, todayFocusSeconds }
  })

  ipcMain.handle('dnd:set', (event, enabled) => {
    hooks.store?.set('dndEnabled', enabled)
    return { success: true }
  })

  ipcMain.handle('dnd:get', () => {
    return {
      enabled: hooks.store?.get('dndEnabled', false) ?? false,
      platform: process.platform
    }
  })

  ipcMain.handle('autolaunch:set', (event, enabled) => {
    setAutoLaunch(enabled)
    return { success: true }
  })

  ipcMain.handle('autolaunch:get', () => {
    return getAutoLaunch()
  })

  ipcMain.handle('stats:get', () => {
    const store = hooks.store
    if (!store) return null

    const history = store.get('sessionHistory', [])
    const today = new Date().toISOString().split('T')[0]

    // Calculate streak
    let streak = 0
    const checkDate = new Date()
    while (streak < 730) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const hasSession = history.some((e) => e.date === dateStr && e.totalFocusSeconds > 0)
      if (!hasSession) break
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Total focus hours all time
    const totalFocusSeconds = history.reduce((sum, e) => sum + e.totalFocusSeconds, 0)

    // Today's focus
    const todayFocus = store.get(`dailyFocus.${today}`, 0)

    return { history, streak, totalFocusSeconds, todayFocus }
  })

  ipcMain.handle('stats:clear', () => {
    hooks.store?.delete('sessionHistory')
    hooks.store?.delete('dailyFocus')
    return { success: true }
  })
}
