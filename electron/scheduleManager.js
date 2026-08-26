import schedule from 'node-schedule'
import { Notification } from 'electron'

let deps = {}
let scheduledJobs = {}

export function initScheduleManager(injectedDeps = {}) {
  deps = injectedDeps
}

function isGNOME() {
  return deps.isGNOME ? deps.isGNOME() : false
}

// scheduleConfig: array of {
//   day: 0-6 (0=Sunday, 1=Monday, ... 6=Saturday),
//   enabled: boolean,
//   startHour: number,
//   startMinute: number,
//   focusMin: number,
//   breakMin: number,
//   totalMin: number,
//   musicEnabled: boolean,
//   prayerEnabled: boolean
// }
export function setupScheduledSessions(scheduleConfig) {
  Object.values(scheduledJobs).forEach((job) => {
    try {
      job.cancel()
    } catch {}
  })
  scheduledJobs = {}

  if (!Array.isArray(scheduleConfig)) return

  scheduleConfig.forEach((cfg) => {
    if (!cfg || !cfg.enabled) return
    const cronExpr = `${cfg.startMinute} ${cfg.startHour} * * ${cfg.day}`
    const job = schedule.scheduleJob(cronExpr, () => {
      try {
        startScheduledSession(cfg)
      } catch {}
    })
    if (job) scheduledJobs[cfg.day] = job
  })
}

export function startScheduledSession(cfg) {
  // If app was launched via --autolaunch, mainWindow is already hidden —
  // just show floating widget (GNOME) or update tray to signal session starting
  if (isGNOME()) {
    const { floatingWindow } = deps.getWindows?.() || {}
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      floatingWindow.show()
    }
  } else {
    deps.updateTrayTitle?.('Starting...', 'focus')
  }

  try {
    new Notification({
      title: '🌿 Grassdoro',
      body: `Deep work session starting — ${cfg.totalMin} min total`
    }).show()
  } catch {}

  // Send IPC to renderer to update UI state even if window is hidden
  const mainWindow = deps.getMainWindow?.()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('session:scheduled-starting', cfg)
  }

  // Wait 5 seconds then auto-start timer (gives user chance to cancel)
  setTimeout(() => {
    createAndStartTimer(cfg)
  }, 5000)
}

export function createAndStartTimer(cfg) {
  const controls = deps.getTimerControls?.()
  if (controls?.start) {
    controls.start(cfg)
  }
}
