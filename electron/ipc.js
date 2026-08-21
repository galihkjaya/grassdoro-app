import { ipcMain } from 'electron'

export function initializeIpc(getWindows) {
  // Timer IPC handlers
  ipcMain.handle('timer:start', (event, config) => {
    // TODO: create PomodoroTimer instance and start
    const { mainWindow, floatingWindow, lockscreenWindow } = getWindows()
    // TODO: onTick → send 'timer:tick' to mainWindow and floatingWindow
    // TODO: onPhaseChange → send 'timer:phase-change' to all windows
    // TODO: onComplete → send 'timer:complete' to all windows, log session
  })

  ipcMain.handle('timer:pause', () => {
    // TODO: timer.pause()
  })

  ipcMain.handle('timer:resume', () => {
    // TODO: timer.resume()
  })

  ipcMain.handle('timer:stop', () => {
    // TODO: timer.stop()
  })

  // Window IPC handlers
  ipcMain.on('window:minimize', () => {
    const { mainWindow, floatingWindow } = getWindows()
    // TODO: hide mainWindow, show floatingWindow
  })

  ipcMain.on('window:show-main', () => {
    const { mainWindow, floatingWindow } = getWindows()
    // TODO: show mainWindow, optionally hide floatingWindow
  })

  ipcMain.on('window:show-floating', () => {
    const { floatingWindow } = getWindows()
    // TODO: show floatingWindow
  })

  ipcMain.on('window:show-lockscreen', () => {
    const { lockscreenWindow } = getWindows()
    // TODO: show lockscreenWindow
  })

  ipcMain.on('window:hide-lockscreen', () => {
    const { lockscreenWindow } = getWindows()
    // TODO: hide lockscreenWindow
  })

  // Settings IPC handlers
  ipcMain.handle('settings:get', (event, key) => {
    // TODO: get from electron-store
    return null
  })

  ipcMain.handle('settings:set', (event, key, value) => {
    // TODO: set to electron-store
  })

  // Prayer IPC handlers
  ipcMain.handle('prayer:get-times', () => {
    // TODO: get prayer times
    return null
  })

  // Auto-launch IPC handlers
  ipcMain.handle('autolaunch:set', (event, enabled) => {
    // TODO: set auto-launch
  })

  // Stats IPC handlers
  ipcMain.handle('stats:get', () => {
    // TODO: get stats from store
    return null
  })

  ipcMain.handle('stats:log-session', (event, session) => {
    // TODO: log session to store
  })
}
