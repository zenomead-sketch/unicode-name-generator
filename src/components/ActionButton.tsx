import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: LucideIcon
  readonly label: string
  readonly variant?: 'primary' | 'secondary' | 'ghost'
}

export function ActionButton({
  icon: Icon,
  label,
  variant = 'primary',
  className,
  ...buttonProps
}: ActionButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'border-cyan-300/35 bg-cyan-300/16 text-cyan-50 hover:bg-cyan-300/22'
      : variant === 'secondary'
        ? 'border-white/10 bg-white/6 text-slate-100 hover:border-white/18 hover:bg-white/10'
        : 'border-white/8 bg-transparent text-slate-300 hover:border-white/16 hover:bg-white/7'

  return (
    <button
      type="button"
      className={[
        'inline-flex items-center gap-2 rounded-2xl border px-4 py-3 font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...buttonProps}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}
