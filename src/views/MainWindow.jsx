import { useEffect, useState } from 'react'
import TimerDisplay from '../components/TimerDisplay'
import ScheduleConfig from '../components/ScheduleConfig'
import StatsGraph from '../components/StatsGraph'
import Settings from '../components/Settings'
import useTimerStore from '../store/timerStore'

const NAV_ITEMS = [
  { id: 'timer', label: 'Timer', icon: TimerIcon },
  { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
  { id: 'stats', label: 'Stats', icon: ChartIcon },
  { id: 'settings', label: 'Settings', icon: CogIcon },
]

function TimerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function CogIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function WindowButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      {children}
    </button>
  )
}

export default function MainWindow() {
  const [activeView, setActiveView] = useState('timer')
  const scheduledStarting = useTimerStore((s) => s.scheduledStarting)
  const clearScheduledStarting = useTimerStore((s) => s.clearScheduledStarting)
  const status = useTimerStore((s) => s.status)

  useEffect(() => {
    if (!scheduledStarting) return
    const timeout = setTimeout(() => clearScheduledStarting(), 6000)
    return () => clearTimeout(timeout)
  }, [scheduledStarting, clearScheduledStarting])

  useEffect(() => {
    if (status === 'running' && scheduledStarting) {
      clearScheduledStarting()
    }
  }, [status, scheduledStarting, clearScheduledStarting])

  const renderView = () => {
    switch (activeView) {
      case 'timer': return <TimerDisplay />
      case 'schedule': return <ScheduleConfig />
      case 'stats': return <StatsGraph />
      case 'settings': return <Settings />
      default: return <TimerDisplay />
    }
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#111111] text-white select-none">
      {/* Custom title bar (frame: false) */}
      <div
        className="h-10 shrink-0 flex items-center px-3 gap-2 border-b border-white/5"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <span className="text-base leading-none">🍅</span>
        <span className="text-sm font-semibold tracking-wide">Grassdoro</span>
        <span className="flex-1" />
        <WindowButton
          onClick={() => window.electronAPI.send('window:minimize')}
          title="Minimize to tray"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </WindowButton>
        <WindowButton
          onClick={() => window.electronAPI.send('window:close')}
          title="Close (runs in tray)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </WindowButton>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-14 shrink-0 flex flex-col items-stretch pt-3 pb-4 gap-1 border-r border-white/5">
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={item.label}
                className={`
                  relative flex items-center justify-center h-11 rounded-lg mx-1 transition-all duration-200
                  ${active ? 'bg-white/5 text-[#4ade80]' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#4ade80]" />
                )}
                <item.icon />
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {activeView === 'timer' ? (
            <div className="h-full overflow-y-auto flex flex-col items-center justify-center py-6">
              <TimerDisplay />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-3xl">{renderView()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Scheduled session toast */}
      {scheduledStarting && (
        <div className="absolute top-12 right-4 z-50 flex items-center gap-2 rounded-lg bg-[#1a2e1f] border border-[#4ade80]/30 px-4 py-2.5 shadow-lg">
          <span className="text-[#4ade80]">🌿</span>
          <span className="text-sm text-white">
            Session starting in 5s... ({scheduledStarting.totalMin} min)
          </span>
        </div>
      )}
    </div>
  )
}
