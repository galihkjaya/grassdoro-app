import { ipcMain } from 'electron'
import { PomodoroTimer } from './timer.js'
import { fetchPrayerTimes, getPrayerTimes, schedulePrayerAlerts, resumeAfterPrayer } from './prayer.js'
import { enableDND, disableDND } from './dnd.js'
import { Notification } from 'electron'

let timer = null
let timerStatus = 'idle'

const timerControls = {
  pause: () => {},
  resume: () => {},
  stop: () => {},
  getStatus: () => timerStatus
}

export function getTimerControls() {
  return timerControls
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

  ipcMain.handle('timer:start', (event, config) => {
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
        const totalSeconds = focusMin * 60
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

  ipcMain.handle('settings:get', (event, key) => {
    // TODO: get from electron-store
    return null
  })

  ipcMain.handle('settings:set', (event, key, value) => {
    // TODO: set to electron-store
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
    // TODO: set auto-launch
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
