import { Howl } from 'howler'

class AudioPlayer {
  constructor() {
    this.lofiSound = null
    this.alarmSound = null
    this.volume = 0.5
  }

  playLofi() {
    const files = this._getLofiFiles()
    if (files.length === 0) return

    this.stopLofi()

    const randomFile = files[Math.floor(Math.random() * files.length)]
    this.lofiSound = new Howl({
      src: [`assets/lofi/${randomFile}`],
      loop: true,
      volume: this.volume,
    })
    this.lofiSound.play()
  }

  stopLofi() {
    if (this.lofiSound) {
      this.lofiSound.stop()
      this.lofiSound.unload()
      this.lofiSound = null
    }
  }

  playAlarm() {
    this.alarmSound = new Howl({
      src: ['assets/alarm.wav'],
      loop: false,
      volume: this.volume,
    })
    this.alarmSound.play()
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.lofiSound) this.lofiSound.volume(this.volume)
    if (this.alarmSound) this.alarmSound.volume(this.volume)
  }

  _getLofiFiles() {
    try {
      const fs = require('fs')
      const path = require('path')
      const lofiDir = path.join(__dirname, '../../assets/lofi')
      if (!fs.existsSync(lofiDir)) return []
      return fs.readdirSync(lofiDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg'))
    } catch {
      return []
    }
  }
}

export default new AudioPlayer()
