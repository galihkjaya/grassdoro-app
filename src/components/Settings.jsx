import { useEffect, useState } from 'react'
import useTimerStore from '../store/timerStore'
import audioPlayer from '../audio/audioPlayer'

export default function Settings() {
  const musicEnabled = useTimerStore((s) => s.musicEnabled)
  const setStoreConfig = useTimerStore((s) => s.setConfig)
  const [volume, setVolume] = useState(50)
  const [lofiAvailable, setLofiAvailable] = useState(false)
  const [dndEnabled, setDndEnabled] = useState(false)
  const [dndPlatform, setDndPlatform] = useState(null)

  useEffect(() => {
    window.electronAPI.invoke('audio:get-lofi-files').then((files) => {
      setLofiAvailable(Array.isArray(files) && files.length > 0)
    }).catch(() => setLofiAvailable(false))
    window.electronAPI.invoke('dnd:get').then((state) => {
      if (!state) return
      setDndEnabled(state.enabled)
      setDndPlatform(state.platform)
    }).catch(() => {})
    audioPlayer.init()
  }, [])

  const handleVolumeChange = (value) => {
    setVolume(value)
    audioPlayer.setVolume(value / 100)
  }

  const handleMusicToggle = () => {
    const next = !musicEnabled
    setStoreConfig({ musicEnabled: next })
    if (next && lofiAvailable) {
      audioPlayer.playLofi()
    } else {
      audioPlayer.stopLofi()
    }
  }

  const handleDndToggle = () => {
    const next = !dndEnabled
    setDndEnabled(next)
    window.electronAPI.invoke('dnd:set', next)
  }

  return (
    <div className="w-80 flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-white">Settings</h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Lofi Music</span>
          <button
            onClick={handleMusicToggle}
            disabled={!lofiAvailable}
            title={lofiAvailable ? undefined : 'Add .mp3 files to assets/lofi/'}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${!lofiAvailable
                ? 'bg-white/5 cursor-not-allowed'
                : musicEnabled
                  ? 'bg-[#4ade80]'
                  : 'bg-white/15'
              }
            `}
          >
            <span
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200
                ${musicEnabled && lofiAvailable ? 'left-[22px]' : 'left-0.5'}
              `}
            />
          </button>
        </div>
        {!lofiAvailable && (
          <p className="text-xs text-white/30">Add .mp3 files to assets/lofi/</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Do Not Disturb</span>
          <button
            onClick={handleDndToggle}
            className={`
              relative w-11 h-6 rounded-full transition-colors duration-200
              ${dndEnabled ? 'bg-[#4ade80]' : 'bg-white/15'}
            `}
          >
            <span
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200
                ${dndEnabled ? 'left-[22px]' : 'left-0.5'}
              `}
            />
          </button>
        </div>
        {dndPlatform === 'win32' && (
          <p className="text-xs text-white/30">
            Windows Focus Assist requires manual setup. Grassdoro will show an in-app indicator instead.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Volume</span>
          <span className="text-xs font-mono text-white/40">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 appearance-none rounded-full bg-white/10 accent-[#4ade80] cursor-pointer"
        />
      </div>
    </div>
  )
}
