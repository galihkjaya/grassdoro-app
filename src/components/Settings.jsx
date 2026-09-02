import { useEffect, useState } from 'react'
import Toggle from './Toggle'
import useTimerStore from '../store/timerStore'
import audioPlayer from '../audio/audioPlayer'

const GITHUB_URL = 'https://github.com/galihkjaya/grassdoro-app'

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function FieldRow({ label, control }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/70">{label}</span>
      {control}
    </div>
  )
}

function NumberInput({ value, onChange, min = 1, max = 999, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || min)}
        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right focus:outline-none focus:border-white/20 transition-colors"
      />
      {suffix && <span className="text-xs text-white/40 w-7">{suffix}</span>}
    </div>
  )
}

function formatProgress(totalSeconds, goalMinutes) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const gh = Math.floor(goalMinutes / 60)
  const gm = goalMinutes % 60
  return `${h}h ${String(m).padStart(2, '0')}m / ${gh}h ${String(gm).padStart(2, '0')}m`
}

const PRAYER_LABELS = { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' }

function cleanTime(raw) {
  const match = /(\d{1,2}:\d{2})/.exec(String(raw || ''))
  return match ? match[1] : '--:--'
}

export default function Settings() {
  const [s, setS] = useState(null)
  const [lofiAvailable, setLofiAvailable] = useState(false)
  const [goalInfo, setGoalInfo] = useState(null)
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [prayerError, setPrayerError] = useState(false)
  const [prayerLoading, setPrayerLoading] = useState(false)

  const setStoreConfig = useTimerStore((s2) => s2.setConfig)

  const fetchGoal = () => {
    window.electronAPI.invoke('goal:get').then((state) => {
      if (state) setGoalInfo(state)
    }).catch(() => {})
  }

  useEffect(() => {
    window.electronAPI.invoke('settings:get').then((settings) => {
      if (settings) setS(settings)
    }).catch(() => {})
    window.electronAPI.invoke('audio:get-lofi-files').then((files) => {
      setLofiAvailable(Array.isArray(files) && files.length > 0)
    }).catch(() => {})
    fetchGoal()
    audioPlayer.init()
  }, [])

  const set = (key, value) => {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev))
    window.electronAPI.invoke('settings:set', { key, value }).catch(() => {})
  }

  const loadPrayerTimes = (city) => {
    if (!city) return
    setPrayerLoading(true)
    setPrayerError(false)
    window.electronAPI.invoke('prayer:get-times', { city })
      .then((timings) => {
        setPrayerTimes(timings || null)
        setPrayerLoading(false)
      })
      .catch(() => {
        setPrayerTimes(null)
        setPrayerError(true)
        setPrayerLoading(false)
      })
  }

  useEffect(() => {
    if (s?.prayerEnabled && s.prayerCity) {
      loadPrayerTimes(s.prayerCity)
    } else if (!s?.prayerCity) {
      setPrayerTimes(null)
      setPrayerError(false)
    }
  }, [s?.prayerEnabled, s?.prayerCity])

  const handleMusicToggle = () => {
    const next = !s.musicEnabled
    set('musicEnabled', next)
    setStoreConfig({ musicEnabled: next })
    if (next && lofiAvailable) {
      audioPlayer.playLofi()
    } else {
      audioPlayer.stopLofi()
    }
  }

  const handleVolumeChange = (value) => {
    set('volume', value)
    audioPlayer.setVolume(value / 100)
  }

  const handleDailyGoal = (value) => {
    const hours = Math.max(1, value || 1)
    set('dailyGoalHours', hours)
    fetchGoal()
  }

  const handlePrayerDuration = (value) => {
    set('prayerDurationMin', Math.max(1, value || 1))
  }

  const handlePrayerToggle = () => {
    const next = !s.prayerEnabled
    set('prayerEnabled', next)
  }

  const setDnd = (value) => {
    set('dndEnabled', value)
  }

  if (!s) {
    return (
      <div className="w-full max-w-xl text-white/40 text-sm p-4">Loading settings...</div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">Settings</h2>

      {/* Timer Defaults */}
      <Section title="Timer Defaults">
        <FieldRow label="Focus duration" control={<NumberInput suffix="min" value={s.focusMin} onChange={(v) => set('focusMin', v)} />} />
        <FieldRow label="Break duration" control={<NumberInput suffix="min" value={s.breakMin} onChange={(v) => set('breakMin', v)} />} />
        <FieldRow label="Long break duration" control={<NumberInput suffix="min" value={s.longBreakMin} onChange={(v) => set('longBreakMin', v)} />} />
        <FieldRow label="Sessions before long break" control={<NumberInput value={s.sessionsBeforeLongBreak} max={12} onChange={(v) => set('sessionsBeforeLongBreak', v)} />} />
        <FieldRow label="Total session time" control={<NumberInput suffix="min" value={s.totalMin} onChange={(v) => set('totalMin', v)} />} />
      </Section>

      {/* Music */}
      <Section title="Music" description={!lofiAvailable ? 'Add .mp3 files to assets/lofi/ folder' : undefined}>
        <FieldRow
          label="Lofi music"
          control={<Toggle checked={s.musicEnabled} onChange={handleMusicToggle} disabled={!lofiAvailable} />}
        />
        {!lofiAvailable && (
          <p className="text-xs text-red-400/80">
            No music files found. Add .mp3 files to the assets/lofi/ folder.
          </p>
        )}
        {lofiAvailable && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Volume</span>
              <span className="text-xs font-mono text-white/40">{s.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={s.volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 appearance-none rounded-full bg-white/10 accent-[#4ade80] cursor-pointer"
            />
          </div>
        )}
      </Section>

      {/* Prayer Time */}
      <Section title="Prayer Time">
        <FieldRow
          label="Prayer time"
          control={<Toggle checked={s.prayerEnabled} onChange={handlePrayerToggle} />}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-white/70">City</span>
          <input
            type="text"
            placeholder="e.g. Semarang"
            value={s.prayerCity}
            onChange={(e) => set('prayerCity', e.target.value)}
            className="w-44 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <FieldRow label="Prayer duration" control={<NumberInput suffix="min" value={s.prayerDurationMin} onChange={handlePrayerDuration} />} />
        {s.prayerCity && s.prayerEnabled && (
          <div className="flex flex-col gap-2">
            {prayerTimes && (
              <div className="flex flex-col gap-1 rounded-lg bg-white/5 p-3 text-sm">
                {Object.entries(PRAYER_LABELS).map(([key, label]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-white/60">{label}</span>
                    <span className="font-mono text-white">{cleanTime(prayerTimes[key])}</span>
                  </div>
                ))}
              </div>
            )}
            {prayerLoading && <p className="text-xs text-white/40">Fetching prayer times...</p>}
            {prayerError && (
              <p className="text-xs text-red-400/80">Could not fetch prayer times. Check your connection.</p>
            )}
            <button
              onClick={() => loadPrayerTimes(s.prayerCity)}
              className="self-start px-4 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors"
            >
              Update Prayer Times
            </button>
          </div>
        )}
      </Section>

      {/* Do Not Disturb */}
      <Section title="Do Not Disturb">
        <FieldRow label="DND during focus" control={<Toggle checked={s.dndEnabled} onChange={setDnd} />} />
        {s.platform === 'win32' && (
          <p className="text-xs text-white/40">
            Windows Focus Assist requires manual configuration. An in-app indicator will be shown instead.
          </p>
        )}
      </Section>

      {/* Daily Goal */}
      <Section title="Daily Goal">
        <FieldRow label="Daily focus goal" control={<NumberInput suffix="hrs" value={s.dailyGoalHours} max={24} onChange={handleDailyGoal} />} />
        {goalInfo && (
          <p className="text-xs text-white/50 font-mono">
            Today: <span className="text-[#4ade80]">{formatProgress(goalInfo.todayFocusSeconds, goalInfo.goalMinutes)}</span>
          </p>
        )}
      </Section>

      {/* Auto-launch */}
      <Section title="Auto-launch" description="Start Grassdoro automatically when your computer turns on">
        <FieldRow label="Launch at startup" control={<Toggle checked={s.autoLaunch} onChange={(v) => set('autoLaunch', v)} />} />
      </Section>

      {/* About */}
      <Section title="About">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">App</span>
            <span className="text-white font-semibold">Grassdoro v2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Version</span>
            <span className="font-mono text-white">{s.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Built with</span>
            <span className="text-white">Electron + React</span>
          </div>
          <button
            onClick={() => window.electronAPI.invoke('shell:open-external', GITHUB_URL)}
            className="mt-2 self-start text-xs text-[#4ade80] hover:underline"
          >
            GitHub Repository →
          </button>
        </div>
      </Section>
    </div>
  )
}
