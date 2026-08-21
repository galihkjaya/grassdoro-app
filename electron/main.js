import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { initializeIpc } from './ipc.js'

let mainWindow = null
let floatingWindow = null
let lockscreenWindow = null

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

app.whenReady().then(() => {
  createMainWindow()
  createFloatingWindow()
  createLockscreenWindow()
  initializeIpc(getWindows)
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
