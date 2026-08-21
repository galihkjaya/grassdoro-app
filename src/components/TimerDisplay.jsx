import { useState } from 'react'
import useTimerStore from '../store/timerStore'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function ProgressRing({ progress, size = 280, strokeWidth = 4, color = '#4ade80' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress * circumference)

  return (
    <svg width={size} height={size} className="absolute rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ffffff08"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
    </svg>
  )
}

export default function TimerDisplay() {
  const {
    status, timeLeft, totalTime, currentPhase, sessionCount,
    focusMin, breakMin, longBreakMin, sessionsBeforeLongBreak,
    setConfig, startTimer, pauseTimer, resumeTimer, stopTimer,
  } = useTimerStore()

  const [config, setConfigState] = useState({
    focusMin, breakMin, totalMin: 60, longBreakMin, sessionsBeforeLongBreak,
  })

  const isRunning = status === 'focus' || status === 'break' || status === 'longbreak'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const isDone = status === 'done'

  const phaseLabel = {
    focus: 'FOCUS',
    break: 'BREAK',
    longbreak: 'LONG BREAK',
  }[currentPhase] || 'FOCUS'

  const phaseColor = {
    focus: '#4ade80',
    break: '#60a5fa',
    longbreak: '#a78bfa',
  }[currentPhase] || '#4ade80'

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0

  const handleStart = () => {
    setConfig(config)
    startTimer()
    window.electronAPI.send('window:minimize')
  }

  const handleConfigChange = (key, value) => {
    setConfigState((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Timer Circle */}
      <div className="relative flex items-center justify-center">
        <ProgressRing progress={progress} color={phaseColor} />

        <div className="flex flex-col items-center z-10">
          {/* Phase Label */}
          <span
            className="text-xs font-semibold tracking-[0.2em] mb-2"
            style={{ color: phaseColor }}
          >
            {isDone ? 'DONE' : phaseLabel}
          </span>

          {/* Timer Digits */}
          <span className="font-mono text-6xl font-bold text-white tabular-nums tracking-wider">
            {formatTime(timeLeft)}
          </span>

          {/* Session Counter */}
          <span className="text-white/30 text-sm mt-2">
            Session {sessionCount + (isRunning || isPaused ? 1 : 0)}/{sessionsBeforeLongBreak}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {isIdle || isDone ? (
          <button
            onClick={handleStart}
            className="px-8 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors"
          >
            Start
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="px-6 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-6 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={stopTimer}
              className="px-6 py-2.5 rounded-lg bg-white/5 text-white/60 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Config Inputs (shown when idle) */}
      {(isIdle || isDone) && (
        <div className="grid grid-cols-2 gap-4 w-72">
          <ConfigInput
            label="Focus (min)"
            value={config.focusMin}
            onChange={(v) => handleConfigChange('focusMin', v)}
            color="#4ade80"
          />
          <ConfigInput
            label="Break (min)"
            value={config.breakMin}
            onChange={(v) => handleConfigChange('breakMin', v)}
            color="#60a5fa"
          />
          <ConfigInput
            label="Total (min)"
            value={config.totalMin}
            onChange={(v) => handleConfigChange('totalMin', v)}
            color="#a78bfa"
          />
          <ConfigInput
            label="Long break every"
            value={config.sessionsBeforeLongBreak}
            onChange={(v) => handleConfigChange('sessionsBeforeLongBreak', v)}
            color="#fb923c"
          />
        </div>
      )}
    </div>
  )
}

function ConfigInput({ label, value, onChange, color }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min="1"
          max="120"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/20 transition-colors"
        />
        <div
          className="absolute left-0 bottom-0 h-[2px] rounded-full transition-all duration-300"
          style={{ width: `${Math.min((value / 120) * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
