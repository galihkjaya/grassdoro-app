import { app } from 'electron'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

let store = null

export function initAutoLaunch(storeInstance) {
  store = storeInstance
}

export function setAutoLaunch(enabled) {
  if (process.platform === 'win32') {
    // Windows: registry via Electron built-in
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: ['--autolaunch']
    })
  } else if (process.platform === 'darwin') {
    // macOS: launchd via Electron built-in
    app.setLoginItemSettings({
      openAtLogin: enabled
    })
  } else if (process.platform === 'linux') {
    // Linux (Ubuntu): create/remove .desktop file in ~/.config/autostart/
    const autostartDir = join(homedir(), '.config', 'autostart')
    const desktopFile = join(autostartDir, 'grassdoro.desktop')

    if (enabled) {
      if (!existsSync(autostartDir)) mkdirSync(autostartDir, { recursive: true })
      const content = `[Desktop Entry]
Type=Application
Name=Grassdoro
Exec=${process.execPath} --autolaunch
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`
      writeFileSync(desktopFile, content)
    } else {
      if (existsSync(desktopFile)) unlinkSync(desktopFile)
    }
  }

  store?.set('autoLaunch', enabled)
}

export function getAutoLaunch() {
  return store?.get('autoLaunch', false) ?? false
}
