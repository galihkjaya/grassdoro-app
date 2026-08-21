import { ipcMain } from 'electron'
import { PomodoroTimer } from './timer.js'

let timer = null

function sendToAll(getWindows, channel, payload) {
  const { mainWindow, floatingWindow, lockscreenWindow } = getWindows()
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
  if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.webContents.send(channel, payload)
  if (lockscreenWindow && !lockscreenWindow.isDestroyed()) lockscreenWindow.webContents.send(channel, payload)
}

export function initializeIpc(getWindows) {
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
        sendToAll(getWindows, 'timer:tick', {
          timeLeft,
          phase,
          sessionCount,
          totalElapsed: timer.totalElapsed,
          totalSeconds: timer.totalSeconds
        })
      },
      onPhaseChange: (phase, sessionCount) => {
        sendToAll(getWindows, 'timer:phase-change', { phase, sessionCount })
      },
      onComplete: (sessionCount) => {
        sendToAll(getWindows, 'timer:complete', {
          totalFocusSeconds: sessionCount * (focusMin * 60),
          sessionCount
        })
      }
    })

    timer.start()
    return { success: true }
  })

  ipcMain.handle('timer:pause', () => {
    if (timer) timer.pause()
    return { success: true }
  })

  ipcMain.handle('timer:resume', () => {
    if (timer) timer.resume()
    return { success: true }
  })

  ipcMain.handle('timer:stop', () => {
    if (timer) timer.stop()
    return { success: true }
  })

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

  ipcMain.handle('prayer:get-times', () => {
    // TODO: get prayer times
    return null
  })

  ipcMain.handle('autolaunch:set', (event, enabled) => {
    // TODO: set auto-launch
  })

  ipcMain.handle('stats:get', () => {
    // TODO: get stats from store
    return null
  })

  ipcMain.handle('stats:log-session', (event, session) => {
    // TODO: log session to store
  })
}
