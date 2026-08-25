import { useEffect, useRef, useState } from 'react'
import useTimerStore from '../store/timerStore'

const ARABIC_NAMES = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  dzuhur: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
  isya: 'العشاء'
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function EmergencyHint() {
  return (
    <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-white/30">
      Emergency exit: Ctrl+Shift+U
    </div>
  )
}

function BreakLockscreen({ timeLeft }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 select-none">
      <h1 className="text-6xl font-bold tracking-[0.25em] text-[#4ade80]">BREAK TIME</h1>
      <p className="text-xl text-white/50">Step away. Rest your eyes.</p>
      <div className="font-mono text-8xl font-bold tabular-nums text-white">
        {formatTime(timeLeft)}
      </div>
      <EmergencyHint />
    </div>
  )
}

function PrayerLockscreen({ prayerName, secondsLeft }) {
  const arabic = ARABIC_NAMES[String(prayerName || '').trim().toLowerCase()] || 'صلاة'

  return (
    <div className="fixed inset-0 select-none bg-[#0a0f0a] flex flex-col items-center justify-center gap-5 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% -20%, rgba(74, 222, 128, 0.15), transparent 55%), radial-gradient(ellipse at 80% 110%, rgba(74, 222, 128, 0.08), transparent 50%)'
        }}
      />
      <span className="text-7xl text-[#4ade80]/90" style={{ fontFamily: 'serif' }}>
        {arabic}
      </span>
      <h1 className="relative text-6xl font-bold tracking-[0.2em] text-white uppercase">
        {prayerName}
      </h1>
      <p className="relative text-xl text-white/50">Time for prayer</p>
      <div className="relative font-mono text-7xl font-bold tabular-nums text-[#4ade80]">
        {formatTime(secondsLeft)}
      </div>
      <EmergencyHint />
    </div>
  )
}

export default function Lockscreen() {
  const [mode, setMode] = useState(null)
  const [prayerMeta, setPrayerMeta] = useState({ prayerName: '', durationMin: 10 })
  const [prayerSecondsLeft, setPrayerSecondsLeft] = useState(0)
  const timeLeft = useTimerStore((s) => s.timeLeft)
  const doneRef = useRef(false)

  useEffect(() => {
    window.electronAPI.on('lockscreen:type', (payload) => {
      const type = typeof payload === 'string' ? payload : payload?.type
      doneRef.current = false

      if (type === 'prayer') {
        const meta = {
          prayerName: payload?.prayerName || 'Prayer',
          durationMin: payload?.durationMin || 10
        }
        setPrayerMeta(meta)
        setPrayerSecondsLeft(meta.durationMin * 60)
      }
      setMode(type === 'prayer' ? 'prayer' : 'break')
    })
  }, [])

  useEffect(() => {
    if (mode !== 'prayer') return undefined
    const interval = setInterval(() => {
      setPrayerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!doneRef.current) {
            doneRef.current = true
            window.electronAPI.send('prayer:done')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [mode])

  if (mode === 'break') {
    return <BreakLockscreen timeLeft={timeLeft} />
  }
  if (mode === 'prayer') {
    return (
      <PrayerLockscreen
        prayerName={prayerMeta.prayerName}
        secondsLeft={prayerSecondsLeft}
      />
    )
  }
  return (
    <div className="fixed inset-0 bg-black select-none" />
  )
}
