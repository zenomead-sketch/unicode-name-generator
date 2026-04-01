import { bannerColors } from '../data/bannerColors'
import type { BannerColorId } from '../types/banner'

interface ColorSelectorProps {
  readonly selectedColorId: BannerColorId
  readonly onSelectColor: (colorId: BannerColorId) => void
}

export function ColorSelector({
  selectedColorId,
  onSelectColor,
}: ColorSelectorProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
            Color
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Pick a basic terminal color
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 font-mono text-xs text-slate-300">
          ANSI palette
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {bannerColors.map((color) => {
          const isSelected = color.id === selectedColorId

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelectColor(color.id)}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                isSelected
                  ? 'border-white/18 bg-white/10'
                  : 'border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/7',
              ].join(' ')}
            >
              <span
                className="h-4 w-4 rounded-full border border-white/10 shadow-[0_0_14px_currentColor]"
                style={{ backgroundColor: color.previewHex, color: color.previewHex }}
              />
              <span className="font-mono text-xs text-slate-100">{color.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
