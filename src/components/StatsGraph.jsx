import { useEffect, useMemo, useState } from 'react'
import useTimerStore from '../store/timerStore'

const DAY_MS = 24 * 60 * 60 * 1000

function dateKey(date) {
  return date.toISOString().split('T')[0]
}

function formatHoursMinutes(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function focusLevel(totalFocusSeconds) {
  const minutes = Math.floor(totalFocusSeconds / 60)
  if (minutes === 0) return '#1a1a1a'
  if (minutes <= 30) return '#166534'
  if (minutes <= 60) return '#16a34a'
  if (minutes <= 120) return '#22c55e'
  return '#4ade80'
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 min-w-[110px]">
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
        {icon} {label}
      </span>
      <span className="text-lg font-semibold text-white font-mono tabular-nums">{value}</span>
    </div>
  )
}

export default function StatsGraph() {
  const [stats, setStats] = useState({ history: [], streak: 0, totalFocusSeconds: 0, todayFocus: 0 })
  const [confirmClear, setConfirmClear] = useState(false)
  const status = useTimerStore((s) => s.status)

  const fetchStats = () => {
    window.electronAPI.invoke('stats:get').then(setStats).catch(() => {})
  }

  useEffect(() => {
    fetchStats()
    const off = window.electronAPI.on('timer:complete', () => {
      fetchStats()
    })
    return () => {
      if (off) off()
    }
  }, [])

  useEffect(() => {
    if (status === 'idle') fetchStats()
  }, [status])

  const { weeks, monthLabels } = useMemo(() => {
    const focusByDate = {}
    stats.history.forEach((entry) => {
      focusByDate[entry.date] = (focusByDate[entry.date] || 0) + entry.totalFocusSeconds
    })

    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const columns = []
    const labels = []
    let prevMonth = -1

    for (let col = 51; col >= 0; col--) {
      const weekStart = new Date(today.getTime() - (today.getDay() + col * 7) * DAY_MS)
      const cells = []
      for (let row = 0; row < 7; row++) {
        const cellDate = new Date(weekStart.getTime() + row * DAY_MS)
        const key = dateKey(cellDate)
        const future = cellDate.getTime() > today.getTime()
        cells.push({
          key,
          seconds: focusByDate[key] || 0,
          future,
          label: `${key} — ${formatHoursMinutes(focusByDate[key] || 0)}`
        })
      }

      const firstOfMonth = weekStart.getDate() <= 7
      const month = weekStart.getMonth()
      if (firstOfMonth && month !== prevMonth) {
        labels.push({ col, name: MONTH_NAMES[month] })
        prevMonth = month
      }

      columns.unshift(cells)
    }

    return { weeks: columns, monthLabels: labels }
  }, [stats.history])

  const sessionsCompleted = useMemo(
    () => stats.history.reduce((sum, entry) => sum + (entry.sessionCount || 0), 0),
    [stats.history]
  )

  const handleClearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    window.electronAPI.invoke('stats:clear').then(() => {
      setConfirmClear(false)
      fetchStats()
    })
  }

  return (
    <div className="flex flex-col gap-6 p-2 max-w-full overflow-x-auto">
      <h2 className="text-lg font-semibold text-white">Statistics</h2>

      {/* Stat cards */}
      <div className="flex gap-4">
        <StatCard icon="🔥" label="Streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} />
        <StatCard icon="⏱" label="Total" value={`${(stats.totalFocusSeconds / 3600).toFixed(1)} hrs`} />
        <StatCard icon="📅" label="Today" value={formatHoursMinutes(stats.todayFocus)} />
      </div>

      {/* Contribution graph */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 w-fit">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {weeks.map((_, col) => (
            <div key={col} className="w-[14px] relative">
              {monthLabels.some((l) => l.col === col) && (
                <span className="absolute text-[9px] text-white/40 whitespace-nowrap">
                  {monthLabels.find((l) => l.col === col).name}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 pt-[1px]">
            {['', 'M', '', 'W', '', 'F', ''].map((label, row) => (
              <div key={row} className="h-[11px] flex items-center justify-end w-5">
                {label && <span className="text-[9px] text-white/40">{label}</span>}
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, col) => (
            <div key={col} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.label}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{ backgroundColor: cell.future ? 'transparent' : focusLevel(cell.seconds) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between w-full max-w-[780px]">
        <span className="text-sm text-white/50">
          <span className="text-white font-semibold">{sessionsCompleted}</span> sessions completed
        </span>
        <button
          onClick={handleClearHistory}
          className={`
            px-4 py-2 rounded-lg text-sm font-semibold transition-colors
            ${confirmClear
              ? 'bg-red-500/90 text-white hover:bg-red-500'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }
          `}
        >
          {confirmClear ? 'Click again to confirm' : 'Clear History'}
        </button>
      </div>
    </div>
  )
}
