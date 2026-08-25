import { app, BrowserWindow, Tray, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { initializeIpc } from './ipc.js'

let mainWindow = null
let floatingWindow = null
let lockscreenWindow = null

let tray = null
let defaultTrayIcon = null

function isDev() {
  return process.env['ELECTRON_RENDERER_URL']
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

async function renderTimerImage(text) {
  try {
    const { createCanvas } = await import('canvas')
    const fontSize = 32
    const probe = createCanvas(1, 1)
    const probeCtx = probe.getContext('2d')
    probeCtx.font = `bold ${fontSize}px monospace`
    const width = Math.max(16, Math.ceil(probeCtx.measureText(text).width) + 12)
    const height = 40

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#4ade80'
    ctx.font = `bold ${fontSize}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 6, height / 2 + 1)

    return nativeImage.createFromBuffer(canvas.toBuffer('image/png'))
  } catch {
    return null
  }
}

function createTray() {
  const iconPath = resolveAssetPath('assets', 'icons', 'tray-icon.png')
  defaultTrayIcon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
  tray = new Tray(defaultTrayIcon)
  tray.setToolTip('Grassdoro — Ready')
  return tray
}

export async function updateTrayTitle(timeLeft, phase) {
  if (!tray || tray.isDestroyed()) return
  const timeString = formatTime(timeLeft)
  try {
    const image = await renderTimerImage(timeString)
    tray.setImage(image || defaultTrayIcon)
    tray.setToolTip(`${phase.toUpperCase()} — ${timeString}`)
    tray.setTitle(timeString)
  } catch {
    tray.setImage(defaultTrayIcon)
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

app.whenReady().then(() => {
  createMainWindow()
  createFloatingWindow()
  createLockscreenWindow()
  createTray()
  initializeIpc(getWindows, {
    onTimerTick: (timeLeft, phase) => {
      updateTrayTitle(timeLeft, phase)
    },
    onTimerState: (status) => {
      if (status === 'idle') setTrayIdle()
    }
  })
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
