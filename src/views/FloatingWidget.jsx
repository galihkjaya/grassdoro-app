import { useEffect, useRef, useState } from 'react'
import useTimerStore from '../store/timerStore'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function FloatingWidget() {
  const timeLeft = useTimerStore((s) => s.timeLeft)
  const totalElapsed = useTimerStore((s) => s.totalElapsed)
  const totalTime = useTimerStore((s) => s.totalTime)
  const dailyFocusSeconds = useTimerStore((s) => s.dailyFocusSeconds)
  const dailyGoalSeconds = useTimerStore((s) => s.dailyGoalSeconds)
  const goalProgress = useTimerStore((s) => s.goalProgress)
  const [status, setStatus] = useState('idle')
  const dragState = useRef(null)
  const clickTimeout = useRef(null)

  useEffect(() => {
    window.electronAPI.on('timer:state', ({ status: next }) => setStatus(next))
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current)
    }
  }, [])

  const running = status === 'running'
  const paused = status === 'paused'

  // Goal progress from tick payload; fallback to session progress before first tick
  let progress = goalProgress
  if (!progress && dailyGoalSeconds > 0) {
    progress = Math.min(dailyFocusSeconds / dailyGoalSeconds, 1)
  } else if (!progress && totalTime > 0) {
    progress = Math.min(totalElapsed / totalTime, 1)
  }
  const goalReached = progress >= 1.0

  const togglePauseResume = () => {
    if (running) {
      window.electronAPI.invoke('timer:pause')
    } else if (paused) {
      window.electronAPI.invoke('timer:resume')
    }
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    dragState.current = { x: e.screenX, y: e.screenY, moved: false }
  }

  const handleMouseMove = (e) => {
    if (!dragState.current) return
    const dx = e.screenX - dragState.current.x
    const dy = e.screenY - dragState.current.y
    if (dx === 0 && dy === 0) return
    dragState.current = { x: e.screenX, y: e.screenY, moved: true }
    window.electronAPI.send('floating:move-by', { dx, dy })
  }

  const handleMouseUp = () => {
    if (!dragState.current) return
    const wasDragged = dragState.current.moved
    dragState.current = null
    window.electronAPI.send('floating:save-position')
    if (wasDragged) return

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
      window.electronAPI.send('window:show-main')
      return
    }
    clickTimeout.current = setTimeout(() => {
      clickTimeout.current = null
      togglePauseResume()
    }, 220)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="w-full h-full rounded-full bg-[#111111CC] border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 select-none cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <span
          className="font-mono text-2xl font-bold tabular-nums tracking-wider leading-none transition-colors duration-300"
          style={{ color: running ? '#4ade80' : '#9ca3af' }}
        >
          {formatTime(timeLeft)}
        </span>
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-linear ${goalReached ? 'animate-pulse' : ''}`}
            style={{ width: `${progress * 100}%`, backgroundColor: goalReached ? '#4ade80' : '#4ade80CC' }}
          />
        </div>
      </div>
    </div>
  )
}
