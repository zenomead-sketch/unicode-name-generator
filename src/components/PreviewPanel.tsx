import { Copy, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { RenderedBannerBundle } from '../types/banner'
import { ActionButton } from './ActionButton'

const TERMINAL_WIDTHS = [80, 100, 120] as const

interface PreviewPanelProps {
  readonly banner: RenderedBannerBundle
  readonly isCopied: boolean
  readonly isAnsiCopied: boolean
  readonly onCopyOutput: () => void
  readonly onCopyAnsiOutput: () => void
}

export function PreviewPanel({
  banner,
  isCopied,
  isAnsiCopied,
  onCopyOutput,
  onCopyAnsiOutput,
}: PreviewPanelProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
            Live Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {banner.style.name} output
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-300">
          <ActionButton
            icon={Copy}
            label={isCopied ? 'Copied' : 'Copy Output'}
            onClick={onCopyOutput}
            variant="secondary"
            className="px-3 py-2 text-xs"
          />
          <ActionButton
            icon={Sparkles}
            label={isAnsiCopied ? 'ANSI Copied' : 'Copy ANSI'}
            onClick={onCopyAnsiOutput}
            variant="secondary"
            className="px-3 py-2 text-xs"
            disabled={banner.color.id === 'plain'}
            title={
              banner.color.id === 'plain'
                ? 'Select a color to enable ANSI output copy.'
                : 'Copy the banner with ANSI escape sequences included.'
            }
          />
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
            {banner.lines.length} rows
          </span>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
            {banner.widestLine} cols
          </span>
        </div>
      </div>

      <div className="terminal-scroll overflow-x-auto px-5 py-5">
        <pre
          className="min-w-max rounded-3xl border border-white/8 bg-[#03060f] px-5 py-5 font-mono text-[12px] leading-5 sm:text-[13px] sm:leading-6"
          style={
            {
              color: banner.color.previewHex,
            } as CSSProperties
          }
        >
          {banner.output}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/8 px-5 py-4 font-mono text-xs text-slate-300">
        <span className="text-slate-400">Fit presets</span>
        {TERMINAL_WIDTHS.map((width) => {
          const fits = banner.widestLine <= width

          return (
            <span
              key={width}
              className={[
                'rounded-full border px-3 py-1.5',
                fits
                  ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                  : 'border-amber-300/20 bg-amber-300/10 text-amber-100',
              ].join(' ')}
            >
              {width} cols {fits ? 'fits' : 'wraps'}
            </span>
          )
        })}
      </div>
    </section>
  )
}
