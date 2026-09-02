import { Howl, Howler } from 'howler'
import useTimerStore from '../store/timerStore'
import alarmUrl from '../../assets/alarm.wav'

class AudioPlayer {
  constructor() {
    this.lofiSound = null
    this.alarmSound = null
    this.volume = 0.5
    this.lofiFiles = []
    this.initialized = false
  }

  async init() {
    try {
      const files = await window.electronAPI.invoke('audio:get-lofi-files')
      this.lofiFiles = Array.isArray(files) ? files : []
      this.initialized = true
    } catch {
      this.lofiFiles = []
    }
    return this.lofiFiles
  }

  hasTracks() {
    return this.lofiFiles.length > 0
  }

  playLofi() {
    if (!this.hasTracks()) return

    const file = this.lofiFiles[Math.floor(Math.random() * this.lofiFiles.length)]
    this.stopLofi()

    this.lofiSound = new Howl({
      src: [`file://${encodeURI(file)}`],
      loop: true,
      volume: this.volume,
      onend: () => this.playLofi()
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

  pauseLofi() {
    this.lofiSound?.pause()
  }

  resumeLofi() {
    this.lofiSound?.play()
  }

  playAlarm() {
    // Unload the previous alarm so Howler doesn't retain its audio buffer
    if (this.alarmSound) {
      this.alarmSound.stop()
      this.alarmSound.unload()
      this.alarmSound = null
    }
    this.alarmSound = new Howl({
      src: [alarmUrl],
      volume: this.volume,
      loop: false
    })
    this.alarmSound.play()
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v))
    Howler.volume(this.volume)
    if (this.lofiSound) this.lofiSound.volume(this.volume)
    if (this.alarmSound) this.alarmSound.volume(this.volume)
  }
}

const audioPlayer = new AudioPlayer()

if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('audio:stop-lofi', () => {
    audioPlayer.stopLofi()
  })
  window.electronAPI.on('audio:resume-lofi', () => {
    if (useTimerStore.getState().musicEnabled) {
      audioPlayer.playLofi()
    }
  })
}

export default audioPlayer
