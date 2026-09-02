import { exec } from 'child_process'
import { safeSend } from './safeSend.js'

let deps = {}

export function initDnd(injectedDeps = {}) {
  deps = injectedDeps
}

function getMainWindow() {
  const windows = deps.getWindows?.()
  const mainWindow = windows?.mainWindow
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

function run(command) {
  try {
    exec(command, () => {})
  } catch {}
}

function notifyUnsupported(enabled) {
  safeSend(getMainWindow(), 'dnd:status', { enabled, platform: 'win32', supported: false })
}

function sendStatus(enabled) {
  safeSend(getMainWindow(), 'dnd:status', { enabled, platform: process.platform, supported: true })
}

export function enableDND() {
  if (process.platform === 'win32') {
    // Windows Focus Assist registry manipulation is complex.
    // Fallback: log that DND was requested, show in-app indicator.
    notifyUnsupported(true)
  } else if (process.platform === 'darwin') {
    // macOS: via shortcuts CLI (macOS 12+) or osascript fallback
    exec(`shortcuts run "Focus"`, (err) => {
      if (err) {
        run(`osascript -e 'tell application "System Events" to tell the current user to set do not disturb to true'`)
      }
    })
    sendStatus(true)
  } else if (process.platform === 'linux') {
    // Ubuntu GNOME: via gsettings
    run(`gsettings set org.gnome.desktop.notifications show-banners false`)
    // Dunst fallback (ignore error if dunst not installed)
    run(`dunstctl set-paused true`)
    sendStatus(true)
  }
}

export function disableDND() {
  if (process.platform === 'win32') {
    notifyUnsupported(false)
  } else if (process.platform === 'darwin') {
    run(`osascript -e 'tell application "System Events" to tell the current user to set do not disturb to false'`)
    sendStatus(false)
  } else if (process.platform === 'linux') {
    run(`gsettings set org.gnome.desktop.notifications show-banners true`)
    run(`dunstctl set-paused false`)
    sendStatus(false)
  }
}
