interface ToggleSwitchProps {
  checked: boolean
  label: string
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleSwitch({ checked, label, disabled = false, onCheckedChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-success' : 'bg-sand-dark'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
