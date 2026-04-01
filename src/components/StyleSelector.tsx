import { bannerStyles } from '../data/renderStyles'
import type { BannerStyleId } from '../types/banner'

interface StyleSelectorProps {
  readonly selectedStyleId: BannerStyleId
  readonly onSelectStyle: (styleId: BannerStyleId) => void
}

export function StyleSelector({
  selectedStyleId,
  onSelectStyle,
}: StyleSelectorProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
            Style
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Pick a Unicode rendering mood
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 font-mono text-xs text-slate-300">
          {bannerStyles.length} styles
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {bannerStyles.map((style) => {
          const isSelected = style.id === selectedStyleId

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              aria-pressed={isSelected}
              className={[
                'group rounded-3xl border px-4 py-4 text-left transition duration-200',
                isSelected
                  ? 'border-white/18 bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'
                  : 'border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/7',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{style.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {style.description}
                  </div>
                </div>
                <span
                  className="h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]"
                  style={{ backgroundColor: style.accent, color: style.accent }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
