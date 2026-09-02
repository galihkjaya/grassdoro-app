export default function Toggle({ checked, onChange, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
        ${disabled
          ? 'bg-white/5 opacity-40 cursor-not-allowed'
          : checked
            ? 'bg-[#4ade80]'
            : 'bg-white/15'}
        ${className}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200
          ${checked && !disabled ? 'left-[22px]' : 'left-0.5'}
        `}
      />
    </button>
  )
}
