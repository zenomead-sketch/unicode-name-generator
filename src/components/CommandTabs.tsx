import { Copy } from 'lucide-react'
import type { CommandBundle, CommandMode, CommandShell } from '../types/banner'
import { ActionButton } from './ActionButton'

interface CommandTabsProps {
  readonly activeShell: CommandShell
  readonly commandMode: CommandMode
  readonly commandBundle: CommandBundle
  readonly isCopied: boolean
  readonly onChangeShell: (shell: CommandShell) => void
  readonly onChangeMode: (mode: CommandMode) => void
  readonly onCopyCommand: () => void
}

export function CommandTabs({
  activeShell,
  commandMode,
  commandBundle,
  isCopied,
  onChangeShell,
  onChangeMode,
  onCopyCommand,
}: CommandTabsProps) {
  const tabs: { id: CommandShell; label: string }[] = [
    { id: 'bash', label: 'Bash / zsh' },
    { id: 'powershell', label: 'PowerShell' },
  ]
  const modes: { id: CommandMode; label: string }[] = [
    { id: 'run', label: 'Run once' },
    { id: 'profile', label: 'Save for future sessions' },
  ]

  const command = commandBundle[activeShell][commandMode]
  const helperText =
    commandMode === 'run'
      ? 'Print the current banner right away in the selected shell.'
      : activeShell === 'bash'
        ? 'Writes or updates the banner in both ~/.bashrc and ~/.zshrc.'
        : 'Writes or updates the banner in $PROFILE.CurrentUserAllHosts.'
  const copyLabel =
    isCopied
      ? 'Copied'
      : commandMode === 'run'
        ? 'Copy Command'
        : 'Copy Save Command'

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
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{helperText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={Copy}
            label={copyLabel}
            onClick={onCopyCommand}
            variant="secondary"
            className="px-3 py-2 text-xs"
          />
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 p-1">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeMode(mode.id)}
                aria-pressed={commandMode === mode.id}
                className={[
                  'rounded-full px-4 py-2 font-mono text-xs transition',
                  commandMode === mode.id
                    ? 'bg-cyan-200 text-slate-950'
                    : 'text-slate-300 hover:text-white',
                ].join(' ')}
              >
                {mode.label}
              </button>
            ))}
          </div>
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
