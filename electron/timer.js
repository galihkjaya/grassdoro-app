export class PomodoroTimer {
  constructor({
    focusMin = 25,
    breakMin = 5,
    totalMin = 60,
    longBreakMin = 15,
    sessionsBeforeLongBreak = 4,
    onTick = () => {},
    onPhaseChange = () => {},
    onComplete = () => {}
  } = {}) {
    this.focusSeconds = focusMin * 60
    this.breakSeconds = breakMin * 60
    this.longBreakSeconds = longBreakMin * 60
    this.totalSeconds = totalMin * 60
    this.sessionsBeforeLongBreak = sessionsBeforeLongBreak

    this.onTick = onTick
    this.onPhaseChange = onPhaseChange
    this.onComplete = onComplete

    this.timeLeft = this.focusSeconds
    this.phase = 'focus'
    this.sessionCount = 0
    this.totalElapsed = 0
    this.intervalId = null
  }

  start() {
    this.timeLeft = this.focusSeconds
    this.phase = 'focus'
    this.sessionCount = 0
    this.totalElapsed = 0
    this.onTick(this.timeLeft, this.phase, this.sessionCount)
    this._startInterval()
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  resume() {
    if (!this.intervalId && this.timeLeft > 0) {
      this._startInterval()
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.timeLeft = this.focusSeconds
    this.phase = 'focus'
    this.sessionCount = 0
    this.totalElapsed = 0
  }

  _startInterval() {
    this.intervalId = setInterval(() => this._tick(), 1000)
  }

  _tick() {
    this.timeLeft--
    this.totalElapsed++

    if (this.timeLeft <= 0) {
      this._switchPhase()
      return
    }

    this.onTick(this.timeLeft, this.phase, this.sessionCount)
  }

  _switchPhase() {
    if (this.phase === 'focus') {
      this.sessionCount++

      if (this.totalElapsed >= this.totalSeconds) {
        this.pause()
        this.onComplete(this.sessionCount)
        return
      }

      if (this.sessionCount % this.sessionsBeforeLongBreak === 0) {
        this.phase = 'longbreak'
        this.timeLeft = this.longBreakSeconds
      } else {
        this.phase = 'break'
        this.timeLeft = this.breakSeconds
      }
    } else {
      if (this.totalElapsed >= this.totalSeconds) {
        this.pause()
        this.onComplete(this.sessionCount)
        return
      }

      this.phase = 'focus'
      this.timeLeft = this.focusSeconds
    }

    this.onPhaseChange(this.phase, this.sessionCount)
    this.onTick(this.timeLeft, this.phase, this.sessionCount)
  }
}
