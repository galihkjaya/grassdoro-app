import { app, BrowserWindow, ipcMain } from 'electron'
import { extname, join } from 'path'
import { existsSync, readdirSync } from 'fs'
import Store from 'electron-store'
import { initializeIpc, getTimerControls } from './ipc.js'
import { initPrayer, getPrayerTimes, schedulePrayerAlerts, triggerPrayerInterrupt } from './prayer.js'

let mainWindow = null
let floatingWindow = null
let lockscreenWindow = null

let store = null

function isDev() {
  return process.env['ELECTRON_RENDERER_URL']
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    frame: false,
    transparent: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js')
    }
  })

  if (isDev()) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

function createFloatingWindow() {
  floatingWindow = new BrowserWindow({
    width: 200,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js')
    }
  })

  if (isDev()) {
    floatingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    floatingWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createLockscreenWindow() {
  lockscreenWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    alwaysOnTop: true,
    fullscreen: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js')
    }
  })

  if (isDev()) {
    lockscreenWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    lockscreenWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function getWindows() {
  return { mainWindow, floatingWindow, lockscreenWindow }
}

function triggerPrayerAlert({ prayerName, durationMin }) {
  triggerPrayerInterrupt(prayerName, durationMin)
}

function showPrayerLockscreen(data) {
  const { lockscreenWindow: lock } = getWindows()
  if (lock && !lock.isDestroyed()) {
    lock.webContents.send('lockscreen:type', { type: 'prayer', ...data })
    lock.show()
    lock.focus()
    lock.moveTop()
  }
}

function hidePrayerLockscreen() {
  const { lockscreenWindow: lock } = getWindows()
  if (lock && !lock.isDestroyed()) {
    lock.hide()
  }
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
  initPrayer({
    store,
    getCity: () => store.get('settings.city', 'Jakarta'),
    getMainWindow: () => mainWindow,
    getTimerControls,
    showLockscreen: (type, data) => showPrayerLockscreen(data),
    hideLockscreen: hidePrayerLockscreen
  })
  createMainWindow()
  createFloatingWindow()
  createLockscreenWindow()
  setupAudioIpc()
  initializeIpc(getWindows, {
    onPrayerTime: triggerPrayerAlert
  })

  if (store.get('settings.prayerEnabled', false)) {
    enablePrayerSchedule()
  }
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
