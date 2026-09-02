import { useState } from 'react'
import Toggle from '../components/Toggle'

const STEPS = ['Welcome', 'Timer', 'Music', 'Prayer', 'Launch']

function NumberInput({ label, value, onChange, suffix }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="999"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-white/20 transition-colors"
        />
        {suffix && <span className="text-xs text-white/40 w-8">{suffix}</span>}
      </div>
    </div>
  )
}

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    focusMin: 25,
    breakMin: 5,
    totalMin: 120,
    musicEnabled: true,
    prayerEnabled: false,
    prayerCity: '',
    autoLaunch: false,
  })

  const set = (key, value) => setData((prev) => ({ ...prev, [key]: value }))

  const saveAll = () => {
    const promises = Object.entries(data).map(([key, value]) =>
      window.electronAPI.invoke('settings:set', { key, value })
    )
    promises.push(window.electronAPI.invoke('settings:set', { key: 'onboardingDone', value: true }))
    Promise.all(promises).then(onDone).catch(onDone)
  }

  return (
    <div className="h-screen w-screen bg-[#111111] text-white flex flex-col items-center justify-center select-none">
      <div className="w-[440px] flex flex-col gap-8">
        <div className="min-h-[340px] flex flex-col justify-center">
          {step === 0 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-6xl">🍅</div>
              <div>
                <h1 className="text-2xl font-bold font-mono mb-2">Welcome to Grassdoro</h1>
                <p className="text-sm text-white/50">A Pomodoro timer built for deep work</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-4 px-6 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors"
              >
                Get Started →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">How long is your focus session?</h2>
                <p className="text-xs text-white/40">You can change these anytime in Settings.</p>
              </div>
              <NumberInput label="Focus duration" suffix="min" value={data.focusMin} onChange={(v) => set('focusMin', v)} />
              <NumberInput label="Break duration" suffix="min" value={data.breakMin} onChange={(v) => set('breakMin', v)} />
              <NumberInput label="Total session time" suffix="min" value={data.totalMin} onChange={(v) => set('totalMin', v)} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Want lofi music during focus?</h2>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                <span className="text-sm text-white/70">Lofi music</span>
                <Toggle checked={data.musicEnabled} onChange={(v) => set('musicEnabled', v)} />
              </div>
              <p className="text-xs text-white/40">Add .mp3 files to assets/lofi/ after setup</p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Enable prayer time reminders?</h2>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                <span className="text-sm text-white/70">Prayer time</span>
                <Toggle checked={data.prayerEnabled} onChange={(v) => set('prayerEnabled', v)} />
              </div>
              {data.prayerEnabled && (
                <input
                  type="text"
                  placeholder="Your city (e.g. Semarang)"
                  value={data.prayerCity}
                  onChange={(e) => set('prayerCity', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Start Grassdoro with your computer?</h2>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                <span className="text-sm text-white/70">Auto-launch</span>
                <Toggle checked={data.autoLaunch} onChange={(v) => set('autoLaunch', v)} />
              </div>
              <p className="text-xs text-white/40">Sessions will start automatically based on your schedule</p>
            </div>
          )}
        </div>

        {step > 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 3 && data.prayerEnabled && !data.prayerCity.trim()}
                className="px-6 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={saveAll}
                className="px-6 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#22c55e] transition-colors"
              >
                Finish →
              </button>
            )}
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((name, i) => (
            <div key={name} title={name} className="flex flex-col items-center gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-6 bg-[#4ade80]' : 'w-1.5 bg-white/15'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
