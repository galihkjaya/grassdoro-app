import { useEffect, useState } from 'react'
import MainWindow from './views/MainWindow'
import FloatingWidget from './views/FloatingWidget'
import Lockscreen from './views/Lockscreen'
import Onboarding from './views/Onboarding'
import useTimerStore from './store/timerStore'
import audioPlayer from './audio/audioPlayer'

function getWindowRoute() {
  return window.location.hash.replace('#', '')
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    window.electronAPI.on('show:onboarding', () => setShowOnboarding(true))

    // Only the main window hosts onboarding; floating/lockscreen have their own routes
    if (getWindowRoute()) return
    window.electronAPI.invoke('settings:get').then((settings) => {
      if (settings && !settings.onboardingDone) setShowOnboarding(true)
    }).catch(() => {})

    window.electronAPI.on('timer:tick', (payload) => {
      useTimerStore.getState().updateTick(payload)
    })

    window.electronAPI.on('timer:phase-change', (payload) => {
      const state = useTimerStore.getState()
      state.updatePhase(payload)

      if (payload.phase === 'focus') {
        if (state.musicEnabled) {
          audioPlayer.playLofi()
        }
      } else {
        audioPlayer.stopLofi()
        audioPlayer.playAlarm()
      }
    })

    window.electronAPI.on('timer:complete', (payload) => {
      audioPlayer.stopLofi()
      audioPlayer.playAlarm()
      useTimerStore.getState().setComplete(payload)
    })

    window.electronAPI.on('session:scheduled-starting', (cfg) => {
      const state = useTimerStore.getState()
      state.setConfig(cfg)
      // Show a toast/banner if main window is open: "Session starting in 5s..."
      state.setScheduledStarting(cfg)
    })
  }, [])

  useEffect(() => {
    audioPlayer.init()

    let prevStatus = useTimerStore.getState().status
    const unsubscribe = useTimerStore.subscribe((state) => {
      if (prevStatus !== 'idle' && state.status === 'idle') {
        audioPlayer.stopLofi()
      }
      prevStatus = state.status
    })
    return unsubscribe
  }, [])

  const route = getWindowRoute()
  if (route === 'floating') return <FloatingWidget />
  if (route === 'lockscreen') return <Lockscreen />
  if (showOnboarding) return <Onboarding onDone={() => setShowOnboarding(false)} />
  return <MainWindow />
}

export default App
