import { useEffect } from 'react'
import MainWindow from './views/MainWindow'
import useTimerStore from './store/timerStore'

function App() {
  useEffect(() => {
    const store = useTimerStore.getState()

    window.electronAPI.on('timer:tick', (payload) => {
      useTimerStore.getState().updateTick(payload)
    })

    window.electronAPI.on('timer:phase-change', (payload) => {
      useTimerStore.getState().updatePhase(payload)
    })

    window.electronAPI.on('timer:complete', (payload) => {
      useTimerStore.getState().setComplete(payload)
    })
  }, [])

  return <MainWindow />
}

export default App
