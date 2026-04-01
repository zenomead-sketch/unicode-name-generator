import { Copy } from 'lucide-react'
import type { CommandBundle, CommandShell } from '../types/banner'
import { ActionButton } from './ActionButton'

interface CommandTabsProps {
  readonly activeShell: CommandShell
  readonly commandBundle: CommandBundle
  readonly isCopied: boolean
  readonly onChangeShell: (shell: CommandShell) => void
  readonly onCopyCommand: () => void
}

export function CommandTabs({
  activeShell,
  commandBundle,
  isCopied,
  onChangeShell,
  onCopyCommand,
}: CommandTabsProps) {
  const tabs: { id: CommandShell; label: string }[] = [
    { id: 'bash', label: 'Bash / zsh' },
    { id: 'powershell', label: 'PowerShell' },
  ]

  const command =
    activeShell === 'bash' ? commandBundle.bash : commandBundle.powershell

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
            Command Panel
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Copy-ready terminal command
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={Copy}
            label={isCopied ? 'Copied' : 'Copy Command'}
            onClick={onCopyCommand}
            variant="secondary"
            className="px-3 py-2 text-xs"
          />
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeShell(tab.id)}
                aria-pressed={activeShell === tab.id}
                className={[
                  'rounded-full px-4 py-2 font-mono text-xs transition',
                  activeShell === tab.id
                    ? 'bg-white text-slate-950'
                    : 'text-slate-300 hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="terminal-scroll overflow-x-auto px-5 py-5">
        <pre className="min-w-max rounded-3xl border border-white/8 bg-[#03060f] px-5 py-5 font-mono text-[12px] leading-6 text-cyan-100 sm:text-[13px]">
          {command}
        </pre>
      </div>
    </section>
  )
}
