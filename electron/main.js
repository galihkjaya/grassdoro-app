import { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, screen } from 'electron'
import { extname, join } from 'path'
import { existsSync, readdirSync } from 'fs'
import Store from 'electron-store'
import { initializeIpc, getTimerControls } from './ipc.js'
import { initPrayer, getPrayerTimes, schedulePrayerAlerts, triggerPrayerInterrupt, cancelPrayerSchedules } from './prayer.js'
import { initScheduleManager, setupScheduledSessions, cancelScheduledSessions } from './scheduleManager.js'
import { initAutoLaunch } from './autolaunch.js'
import { initDnd, disableDND } from './dnd.js'
import { safeSend } from './safeSend.js'

let mainWindow = null
let floatingWindow = null
let lockscreenWindow = null

let store = null
let tray = null
let defaultTrayIcon = null
let timerActive = false
let secondaryLockscreens = []
let lockscreenIsActive = false
let mainIpcRegistered = false

// Reusable tray canvas — created once, redrawn every tick instead of
// allocating a new canvas + nativeImage per second (memory churn).
let trayCanvas = null
let trayCtx = null
let canvasModulePromise = null

function isDev() {
  return process.env['ELECTRON_RENDERER_URL']
}

function isGnomeDesktop() {
  return (process.env.XDG_CURRENT_DESKTOP || '').toUpperCase().includes('GNOME')
}

function resolveAssetPath(...segments) {
  const localPath = join(__dirname, '../../', ...segments)
  if (existsSync(localPath)) return localPath
  if (process.resourcesPath) {
    const packagedPath = join(process.resourcesPath, ...segments)
    if (existsSync(packagedPath)) return packagedPath
  }
  return null
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getCanvasModule() {
  if (!canvasModulePromise) {
    canvasModulePromise = import('canvas').catch(() => null)
  }
  return canvasModulePromise
}

async function initTrayCanvas() {
  if (trayCanvas) return true
  const { createCanvas } = (await getCanvasModule()) || {}
  if (!createCanvas) return false
  trayCanvas = createCanvas(96, 40)
  trayCtx = trayCanvas.getContext('2d')
  trayCtx.font = 'bold 28px monospace'
  trayCtx.textBaseline = 'middle'
  return true
}

async function renderTrayImage(timeString) {
  if (!(await initTrayCanvas())) return null
  // Redraw on the single reused canvas
  trayCtx.clearRect(0, 0, trayCanvas.width, trayCanvas.height)
  trayCtx.fillStyle = '#111111'
  trayCtx.fillRect(0, 0, trayCanvas.width, trayCanvas.height)
  trayCtx.fillStyle = '#4ade80'
  trayCtx.fillText(timeString, 6, trayCanvas.height / 2 + 1)
  return nativeImage.createFromBuffer(trayCanvas.toBuffer('image/png'))
}

function createTray() {
  const iconPath = resolveAssetPath('assets', 'icons', 'tray-icon.png')
  defaultTrayIcon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
  tray = new Tray(defaultTrayIcon)
  tray.setToolTip('Grassdoro — Ready')
  setupTrayEvents()
  updateTrayMenu('idle')
  return tray
}

export async function updateTrayTitle(timeLeft, phase) {
  if (!tray || tray.isDestroyed()) return
  const timeString = formatTime(timeLeft)
  try {
    const image = await renderTrayImage(timeString)
    if (!tray.isDestroyed()) {
      tray.setImage(image || defaultTrayIcon)
      tray.setToolTip(`${phase.toUpperCase()} — ${timeString}`)
      tray.setTitle(timeString)
    }
  } catch {
    if (!tray.isDestroyed()) tray.setImage(defaultTrayIcon)
  }
}

export function setTrayIdle() {
  if (!tray || tray.isDestroyed()) return
  try {
    tray.setImage(defaultTrayIcon)
    tray.setToolTip('Grassdoro — Ready')
    tray.setTitle('')
  } catch {}
}

function buildTrayMenu(status) {
  const controls = getTimerControls()
  const template = [
    { label: 'Grassdoro', enabled: false },
    { type: 'separator' }
  ]

  if (status === 'running') {
    template.push(
      { label: '⏸ Pause', click: () => controls.pause() },
      { label: '⏹ Stop', click: () => controls.stop() }
    )
  } else if (status === 'paused') {
    template.push(
      { label: '▶ Resume', click: () => controls.resume() },
      { label: '⏹ Stop', click: () => controls.stop() }
    )
  }

  template.push(
    { type: 'separator' },
    { label: '🪟 Open', click: () => showMainWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  )

  return Menu.buildFromTemplate(template)
}

function updateTrayMenu(status) {
  if (!tray || tray.isDestroyed()) return
  try {
    tray.setContextMenu(buildTrayMenu(status))
  } catch {}
}

function setupTrayEvents() {
  if (!tray) return
  const controls = getTimerControls()

  tray.on('click', () => {
    const status = controls.getStatus()
    if (status === 'running') {
      controls.pause()
    } else if (status === 'paused') {
      controls.resume()
    }
  })

  tray.on('double-click', () => {
    showMainWindow()
  })
}

function createMainWindow() {
  const launchedViaAutostart = process.argv.includes('--autolaunch')
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    frame: false,
    transparent: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/preload.js')
    }
  })

  if (isDev()) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    if (launchedViaAutostart) {
      // Started minimized to tray — wait for scheduled session to trigger
      mainWindow.hide()
    } else {
      mainWindow.show()
    }

    // First launch: show the onboarding wizard
    if (store && !store.get('onboardingDone', false)) {
      safeSend(mainWindow, 'show:onboarding', undefined)
    }
  })
}

function createFloatingWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  floatingWindow = new BrowserWindow({
    width: 160,
    height: 70,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/preload.js')
    }
  })

  if (isDev()) {
    floatingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#floating`)
  } else {
    floatingWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'floating' })
  }

  const pos = store.get('floatingPosition', { x: screenWidth - 180, y: screenHeight - 100 })
  floatingWindow.setPosition(pos.x, pos.y)

  floatingWindow.on('moved', () => {
    saveFloatingPosition()
  })
}

function saveFloatingPosition() {
  if (!floatingWindow || floatingWindow.isDestroyed() || !store) return
  const [x, y] = floatingWindow.getPosition()
  store.set('floatingPosition', { x, y })
}

function updateFloatingVisibility() {
  if (!floatingWindow || floatingWindow.isDestroyed()) return
  const mainHidden = !mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()
  if (timerActive && mainHidden) {
    floatingWindow.show()
  } else {
    floatingWindow.hide()
  }
}

function createLockscreenWindow() {
  lockscreenWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/preload.js')
    }
  })

  lockscreenWindow.setAlwaysOnTop(true, 'screen-saver')
  lockscreenWindow.setFullScreenable(true)
  lockscreenWindow.setVisibleOnAllWorkspaces(true)

  if (isDev()) {
    lockscreenWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#lockscreen`)
  } else {
    lockscreenWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'lockscreen' })
  }

  lockscreenWindow.on('blur', () => {
    if (lockscreenIsActive && !lockscreenWindow.isDestroyed()) {
      lockscreenWindow.focus()
    }
  })

  lockscreenWindow.on('close', (e) => {
    if (lockscreenIsActive) {
      e.preventDefault()
    }
  })
}

function createSecondaryLockscreens() {
  closeSecondaryLockscreens()
  const primaryId = screen.getPrimaryDisplay().id
  const displays = screen.getAllDisplays().filter((d) => d.id !== primaryId)

  secondaryLockscreens = displays.map((display) => {
    const overlay = new BrowserWindow({
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.size.width,
      height: display.size.height,
      fullscreen: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    })
    overlay.setAlwaysOnTop(true, 'screen-saver')
    overlay.setVisibleOnAllWorkspaces(true)
    return overlay
  })
}

function closeSecondaryLockscreens() {
  secondaryLockscreens.forEach((win) => {
    if (!win.isDestroyed()) win.destroy()
  })
  secondaryLockscreens = []
}

function showLockscreen(type, data = {}) {
  lockscreenIsActive = true
  createSecondaryLockscreens()

  if (lockscreenWindow && !lockscreenWindow.isDestroyed()) {
    safeSend(lockscreenWindow, 'lockscreen:type', { type, ...data })
    lockscreenWindow.show()
    lockscreenWindow.focus()
    lockscreenWindow.moveTop()
    lockscreenWindow.setFullScreen(true)
  }

  secondaryLockscreens.forEach((win) => {
    win.show()
    win.moveTop()
  })
}

function hideLockscreen() {
  lockscreenIsActive = false
  if (lockscreenWindow && !lockscreenWindow.isDestroyed()) {
    lockscreenWindow.hide()
  }
  secondaryLockscreens.forEach((win) => {
    if (!win.isDestroyed()) win.hide()
  })
  closeSecondaryLockscreens()
}

function setupLockscreenIpc() {
  ipcMain.on('lockscreen:show', (event, payload) => {
    if (typeof payload === 'string') {
      showLockscreen(payload)
    } else if (payload && typeof payload === 'object') {
      const { type, ...rest } = payload
      showLockscreen(type || 'break', rest)
    } else {
      showLockscreen('break')
    }
  })

  ipcMain.on('lockscreen:hide', () => {
    hideLockscreen()
  })

  ipcMain.on('prayer:done', () => {
    hideLockscreen()
    getTimerControls().resume()
  })
}

function getWindows() {
  return { mainWindow, floatingWindow, lockscreenWindow }
}

function setupFloatingIpc() {
  ipcMain.on('floating:show', () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.show()
  })

  ipcMain.on('floating:hide', () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) floatingWindow.hide()
  })

  ipcMain.on('floating:move-by', (event, { dx, dy }) => {
    if (!floatingWindow || floatingWindow.isDestroyed()) return
    const [x, y] = floatingWindow.getPosition()
    floatingWindow.setPosition(x + dx, y + dy)
  })

  ipcMain.on('floating:save-position', () => {
    saveFloatingPosition()
  })
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.show()
  mainWindow.focus()
  updateFloatingVisibility()
}

function setupEmergencyExit() {
  globalShortcut.register('CommandOrControl+Shift+U', () => {
    hideLockscreen()
    getTimerControls().stop()
    showMainWindow()
  })
}

function triggerPrayerAlert({ prayerName, durationMin }) {
  triggerPrayerInterrupt(prayerName, durationMin)
}

function setupAudioIpc() {
  ipcMain.handle('audio:get-lofi-files', () => {
    const candidates = [
      join(__dirname, '../../assets/lofi'),
      process.resourcesPath ? join(process.resourcesPath, 'assets', 'lofi') : null
    ]
    const lofiDir = candidates.find((p) => p && existsSync(p))
    if (!lofiDir) return []
    try {
      return readdirSync(lofiDir)
        .filter((f) => ['.mp3', '.ogg', '.wav'].includes(extname(f).toLowerCase()))
        .map((f) => join(lofiDir, f))
    } catch {
      return []
    }
  })
}

function enablePrayerSchedule() {
  const city = store.get('settings.city', 'Jakarta')
  const durationMin = store.get('settings.prayerDurationMin', 10)
  getPrayerTimes(city).then((timings) => {
    if (!timings) return
    schedulePrayerAlerts(timings, { durationMin }, triggerPrayerAlert)
  }).catch(() => {})
}

app.whenReady().then(() => {
  store = new Store()
  initAutoLaunch(store)
  initPrayer({
    store,
    getCity: () => store.get('settings.city', 'Jakarta'),
    getMainWindow: () => mainWindow,
    getTimerControls,
    showLockscreen,
    hideLockscreen
  })
  createMainWindow()
  createFloatingWindow()
  createLockscreenWindow()

  mainWindow.on('show', updateFloatingVisibility)
  mainWindow.on('hide', updateFloatingVisibility)

  if (!mainIpcRegistered) {
    mainIpcRegistered = true
    setupFloatingIpc()
    setupLockscreenIpc()
    setupEmergencyExit()
    setupAudioIpc()
  }

  if (!isGnomeDesktop()) {
    createTray()
  }

  initializeIpc(getWindows, {
    store,
    onTimerTick: (timeLeft, phase) => {
      if (tray) updateTrayTitle(timeLeft, phase)
    },
    onTimerState: (status) => {
      timerActive = status === 'running' || status === 'paused'
      if (tray) updateTrayMenu(status)
      if (tray && status === 'idle') setTrayIdle()
      updateFloatingVisibility()
    },
    onPrayerTime: triggerPrayerAlert
  })

  initScheduleManager({
    store,
    getWindows,
    getMainWindow: () => mainWindow,
    getTimerControls,
    updateTrayTitle,
    isGNOME: isGnomeDesktop
  })

  initDnd({ getWindows })

  const savedSchedule = store.get('scheduleConfig', [])
  if (savedSchedule.length > 0) {
    setupScheduledSessions(savedSchedule)
  }

  if (store.get('settings.prayerEnabled', false)) {
    enablePrayerSchedule()
  }
})

app.on('before-quit', () => {
  // Full app cleanup: cancel scheduled/pending sessions, stop the running
  // timer (persists partial focus to store), re-enable DND, drop shortcuts.
  cancelScheduledSessions()
  cancelPrayerSchedules()
  try {
    getTimerControls().stop()
  } catch {}
  disableDND()
  timerActive = false
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
