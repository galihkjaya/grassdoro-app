import { useEffect, useState } from 'react'
import Toggle from './Toggle'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
// cron/JS weekday: 0 = Sunday ... 6 = Saturday
const JS_DAY_TO_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

function defaultRow(jsDay, index) {
  return {
    day: JS_DAY_TO_INDEX[jsDay], // 0-6 for scheduleManager
    enabled: false,
    startHour: 9,
    startMinute: 0,
    focusMin: 25,
    breakMin: 5,
    totalMin: 120,
    longBreakMin: 15,
    sessionsBeforeLongBreak: 4,
    label: DAY_NAMES[index]
  }
}

const EMPTY = []

export default function ScheduleConfig() {
  const [rows, setRows] = useState(EMPTY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.electronAPI.invoke('schedule:get').then((cfg) => {
      if (!Array.isArray(cfg) || cfg.length === 0) {
        setRows(DAY_NAMES.map((_, i) => defaultRow((i + 1) % 7, i)))
        return
      }
      setRows(cfg.map((row, i) => ({ ...defaultRow((i + 1) % 7, i), ...row, label: DAY_NAMES[i] })))
    }).catch(() => {})
  }, [])

  const update = (index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const save = () => {
    const cfg = rows.map(({ label: _label, ...rest }) => rest)
    window.electronAPI.invoke('schedule:set', cfg).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }).catch(() => {})
  }

  const nextSession = (() => {
    const now = new Date()
    let best = null
    rows.forEach((row) => {
      if (!row.enabled) return
      const target = new Date(now)
      target.setHours(row.startHour, row.startMinute, 0, 0)
      const jsToday = now.getDay()
      let daysAhead = (row.day - jsToday + 7) % 7
      if (daysAhead === 0 && target <= now) daysAhead = 7
      target.setDate(target.getDate() + daysAhead)
      if (!best || target < best.target) best = { target, daysAhead, row }
    })
    return best
  })()

  const nextLabel = nextSession
    ? `${nextSession.row.label} at ${String(nextSession.row.startHour).padStart(2, '0')}:${String(nextSession.row.startMinute).padStart(2, '0')} (${nextSession.daysAhead === 0 ? 'today' : nextSession.daysAhead === 1 ? 'in 1 day' : `in ${nextSession.daysAhead} days`})`
    : 'None — enable a day to get started'

  return (
    <div className="w-full flex flex-col gap-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Schedule</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Next session: <span className="text-[#4ade80]">{nextLabel}</span>
        </p>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-white/40 border-b border-white/10">
              <th className="px-3 py-2.5 font-medium">Day</th>
              <th className="px-2 py-2.5 font-medium">On</th>
              <th className="px-2 py-2.5 font-medium">Start</th>
              <th className="px-2 py-2.5 font-medium text-right">Focus (min)</th>
              <th className="px-2 py-2.5 font-medium text-right">Break (min)</th>
              <th className="px-3 py-2.5 font-medium text-right">Total (min)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-white/5 last:border-0 transition-opacity ${row.enabled ? '' : 'opacity-40'}`}
              >
                <td className="px-3 py-2.5 text-white">{row.label}</td>
                <td className="px-2 py-2.5">
                  <Toggle checked={row.enabled} onChange={(v) => update(i, { enabled: v })} />
                </td>
                <td className="px-2 py-2.5">
                  <input
                    type="time"
                    disabled={!row.enabled}
                    value={`${String(row.startHour).padStart(2, '0')}:${String(row.startMinute).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number)
                      update(i, { startHour: h, startMinute: m })
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono disabled:opacity-50 focus:outline-none focus:border-white/20 [color-scheme:dark] transition-colors"
                  />
                </td>
                <td className="px-2 py-2.5">
                  <CellInput value={row.focusMin} disabled={!row.enabled} onChange={(v) => update(i, { focusMin: v })} />
                </td>
                <td className="px-2 py-2.5">
                  <CellInput value={row.breakMin} disabled={!row.enabled} onChange={(v) => update(i, { breakMin: v })} />
                </td>
                <td className="px-3 py-2.5">
                  <CellInput value={row.totalMin} disabled={!row.enabled} onChange={(v) => update(i, { totalMin: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors"
        >
          Apply Schedule
        </button>
        {saved && (
          <span className="text-sm text-[#4ade80] animate-pulse">Schedule saved ✓</span>
        )}
      </div>
    </div>
  )
}

function CellInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min="1"
      max="600"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right disabled:opacity-50 focus:outline-none focus:border-white/20 transition-colors"
    />
  )
}
