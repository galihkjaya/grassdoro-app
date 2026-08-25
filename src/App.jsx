import { useEffect } from 'react'
import MainWindow from './views/MainWindow'
import FloatingWidget from './views/FloatingWidget'
import Lockscreen from './views/Lockscreen'
import useTimerStore from './store/timerStore'
import audioPlayer from './audio/audioPlayer'

function getWindowRoute() {
  return window.location.hash.replace('#', '')
}

function App() {
  useEffect(() => {
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
  return <MainWindow />
}

export default App
