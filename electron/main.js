import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { initializeIpc } from './ipc.js'

let mainWindow = null
let floatingWindow = null
let lockscreenWindow = null

let secondaryLockscreens = []
let lockscreenIsActive = false

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
      preload: join(__dirname, 'preload.js')
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
    lockscreenWindow.webContents.send('lockscreen:type', { type, ...data })
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
}

function getWindows() {
  return { mainWindow, floatingWindow, lockscreenWindow }
}

app.whenReady().then(() => {
  createMainWindow()
  createFloatingWindow()
  createLockscreenWindow()
  setupLockscreenIpc()
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
