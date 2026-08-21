import { create } from 'zustand'

const useTimerStore = create((set) => ({
  status: 'idle',
  timeLeft: 0,
  totalTime: 0,
  currentPhase: 'focus',
  sessionCount: 0,
  dailyFocusSeconds: 0,
  dailyGoalSeconds: 0,

  setStatus: (status) => set({ status }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setTotalTime: (totalTime) => set({ totalTime }),
  setCurrentPhase: (currentPhase) => set({ currentPhase }),
  setSessionCount: (sessionCount) => set({ sessionCount }),
  setDailyFocusSeconds: (dailyFocusSeconds) => set({ dailyFocusSeconds }),
  setDailyGoalSeconds: (dailyGoalSeconds) => set({ dailyGoalSeconds }),
}))

export default useTimerStore
