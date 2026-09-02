import { contextBridge, ipcRenderer } from 'electron'

const validChannels = [
  'timer:tick',
  'timer:phase-change',
  'timer:complete',
  'timer:state',
  'lockscreen:type',
  'audio:stop-lofi',
  'audio:resume-lofi',
  'session:scheduled-starting',
  'dnd:status',
  'show:onboarding'
]

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  // Returns an unsubscribe function so React effects can clean up
  on: (channel, callback) => {
    if (!validChannels.includes(channel)) return () => {}
    const wrapped = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
