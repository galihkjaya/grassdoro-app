export function safeSend(win, channel, payload) {
  try {
    if (!win || win.isDestroyed()) return false
    const wc = win.webContents
    if (!wc || wc.isDestroyed()) return false
    wc.send(channel, payload)
    return true
  } catch (e) {
    console.warn(`safeSend failed on channel ${channel}:`, e?.message)
    return false
  }
}
