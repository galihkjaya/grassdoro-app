import { create } from 'zustand'

const useTimerStore = create((set, get) => ({
  status: 'idle',
  timeLeft: 0,
  totalTime: 0,
  currentPhase: 'focus',
  sessionCount: 0,
  totalElapsed: 0,
  dailyFocusSeconds: 0,
  dailyGoalSeconds: 0,
  goalProgress: 0,

  focusMin: 25,
  breakMin: 5,
  totalMin: 60,
  longBreakMin: 15,
  sessionsBeforeLongBreak: 4,
  musicEnabled: true,
  prayerEnabled: false,

  setConfig: (config) => set({
    focusMin: config.focusMin ?? 25,
    breakMin: config.breakMin ?? 5,
    totalMin: config.totalMin ?? 60,
    longBreakMin: config.longBreakMin ?? 15,
    sessionsBeforeLongBreak: config.sessionsBeforeLongBreak ?? 4,
    musicEnabled: config.musicEnabled ?? true,
    prayerEnabled: config.prayerEnabled ?? false,
  }),

  startTimer: async () => {
    const state = get()
    const config = {
      focusMin: state.focusMin,
      breakMin: state.breakMin,
      totalMin: state.totalMin,
      longBreakMin: state.longBreakMin,
      sessionsBeforeLongBreak: state.sessionsBeforeLongBreak,
      musicEnabled: state.musicEnabled,
      prayerEnabled: state.prayerEnabled,
    }
    set({ status: 'focus', totalTime: config.totalMin * 60 })
    await window.electronAPI.invoke('timer:start', config)
  },

  pauseTimer: async () => {
    set({ status: 'paused' })
    await window.electronAPI.invoke('timer:pause')
  },

  resumeTimer: async () => {
    const state = get()
    set({ status: state.currentPhase })
    await window.electronAPI.invoke('timer:resume')
  },

  stopTimer: async () => {
    set({
      status: 'idle',
      timeLeft: 0,
      totalTime: 0,
      currentPhase: 'focus',
      sessionCount: 0,
      totalElapsed: 0,
    })
    await window.electronAPI.invoke('timer:stop')
  },

  updateTick: (payload) => set({
    timeLeft: payload.timeLeft,
    currentPhase: payload.phase,
    sessionCount: payload.sessionCount,
    totalElapsed: payload.totalElapsed,
    totalTime: payload.totalSeconds,
    goalProgress: payload.goalProgress ?? get().goalProgress,
  }),

  updatePhase: (payload) => set({
    currentPhase: payload.phase,
    sessionCount: payload.sessionCount,
  }),

  setComplete: (payload) => {
    set((state) => ({
      status: 'done',
      dailyFocusSeconds: state.dailyFocusSeconds + (payload?.totalFocusSeconds || 0),
    }))
  },
}))

export default useTimerStore
