import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import {
  ClipboardPaste,
  Download,
  Link2,
  RefreshCcw,
  Shuffle,
  Sparkles,
} from 'lucide-react'
import { ActionButton } from './components/ActionButton'
import { ColorSelector } from './components/ColorSelector'
import { CommandTabs } from './components/CommandTabs'
import { PreviewPanel } from './components/PreviewPanel'
import { StyleSelector } from './components/StyleSelector'
import { bannerColors } from './data/bannerColors'
import { bannerStyles } from './data/renderStyles'
import { createBannerBundle } from './lib/bannerRenderer'
import { copyText, readClipboardText } from './lib/clipboard'
import {
  createBannerShareUrl,
  readBannerShareState,
  writeBannerShareState,
} from './lib/shareState'
import type {
  BannerColorId,
  BannerStyleId,
  CommandMode,
  CommandShell,
} from './types/banner'

const DEFAULT_TEXT = 'ALEX-77'
const CHARACTER_LIMIT = 32
const WIDTH_WARNING = 140
const PRESET_EXAMPLES = [
  'ALEX',
  'BYTE-77',
  'ZEN_MODE',
  'NOVA 9',
  'PIXEL-RUN',
] as const
const DEFAULT_SHARE_STATE = {
  text: DEFAULT_TEXT,
  styleId: 'heavy' as BannerStyleId,
  colorId: 'plain' as BannerColorId,
  trimTrailingSpaces: true,
  shell: 'bash' as CommandShell,
}

function App() {
  const [initialShareState] = useState(() =>
    readBannerShareState(DEFAULT_SHARE_STATE),
  )

  const [inputText, setInputText] = useState(initialShareState.text)
  const [selectedStyleId, setSelectedStyleId] = useState<BannerStyleId>(
    initialShareState.styleId,
  )
  const [selectedColorId, setSelectedColorId] = useState<BannerColorId>(
    initialShareState.colorId,
  )
  const [trimTrailingSpaces, setTrimTrailingSpaces] = useState(
    initialShareState.trimTrailingSpaces,
  )
  const [activeShell, setActiveShell] = useState<CommandShell>(
    initialShareState.shell,
  )
  const [commandMode, setCommandMode] = useState<CommandMode>('run')
  const [clipboardAction, setClipboardAction] = useState<
    | 'output'
    | 'command'
    | 'ansi'
    | 'share'
    | 'paste'
    | 'copy-error'
    | 'paste-error'
    | null
  >(null)
  const [renderSeed, setRenderSeed] = useState(0)
  const [bannerBundle, setBannerBundle] = useState(() =>
    createBannerBundle({
      text: initialShareState.text,
      styleId: initialShareState.styleId,
      colorId: initialShareState.colorId,
      trimTrailingSpaces: initialShareState.trimTrailingSpaces,
    }),
  )

  const deferredInput = useDeferredValue(inputText)
  const currentCommand = bannerBundle.commands[activeShell][commandMode]
  const canPasteFromClipboard =
    typeof navigator !== 'undefined' && !!navigator.clipboard?.readText
  const styleAccent = bannerBundle.style.accent
  const isWideBanner = bannerBundle.widestLine >= WIDTH_WARNING
  const statusMessage =
    clipboardAction === 'output'
      ? 'Banner output copied to your clipboard.'
      : clipboardAction === 'command'
        ? commandMode === 'run'
          ? `${activeShell === 'bash' ? 'Bash/zsh' : 'PowerShell'} command copied.`
          : commandMode === 'remove'
            ? `${activeShell === 'bash' ? 'Bash/zsh' : 'PowerShell'} profile removal command copied.`
          : `${activeShell === 'bash' ? 'Bash/zsh' : 'PowerShell'} profile install command copied.`
        : clipboardAction === 'ansi'
          ? 'ANSI-colored output copied with escape codes included.'
        : clipboardAction === 'share'
          ? 'Share link copied with your current text, style, color, and settings.'
        : clipboardAction === 'paste'
          ? 'Clipboard text pasted into the banner input.'
        : clipboardAction === 'copy-error'
          ? 'Copy could not complete in this browser context.'
        : clipboardAction === 'paste-error'
          ? 'Clipboard paste is unavailable or permission was denied.'
        : isWideBanner
          ? 'Wide banners may wrap in smaller terminal windows.'
          : bannerBundle.unsupportedCharacters.length > 0
            ? 'Unsupported characters were replaced with a fallback glyph.'
            : 'Live preview stays in sync while you type.'

  useEffect(() => {
    startTransition(() => {
      setBannerBundle(
        createBannerBundle({
          text: deferredInput,
          styleId: selectedStyleId,
          colorId: selectedColorId,
          trimTrailingSpaces,
        }),
      )
    })
  }, [
    deferredInput,
    selectedStyleId,
    selectedColorId,
    trimTrailingSpaces,
    renderSeed,
  ])

  useEffect(() => {
    if (!clipboardAction) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setClipboardAction(null)
    }, 1600)

    return () => window.clearTimeout(timeoutId)
  }, [clipboardAction])

  useEffect(() => {
    writeBannerShareState({
      text: inputText,
      styleId: selectedStyleId,
      colorId: selectedColorId,
      trimTrailingSpaces,
      shell: activeShell,
    })
  }, [inputText, selectedStyleId, selectedColorId, trimTrailingSpaces, activeShell])

  const handleGenerate = () => {
    setRenderSeed((seed) => seed + 1)
    startTransition(() => {
      setBannerBundle(
        createBannerBundle({
          text: inputText,
          styleId: selectedStyleId,
          colorId: selectedColorId,
          trimTrailingSpaces,
        }),
      )
    })
  }

  const handleRandomStyle = () => {
    const alternateStyles = bannerStyles.filter(
      (style) => style.id !== selectedStyleId,
    )
    const nextStyle =
      alternateStyles[Math.floor(Math.random() * alternateStyles.length)] ??
      bannerStyles[0]

    setSelectedStyleId(nextStyle.id)
  }

  const handleRandomColor = () => {
    const alternateColors = bannerColors.filter(
      (color) => color.id !== selectedColorId,
    )
    const nextColor =
      alternateColors[Math.floor(Math.random() * alternateColors.length)] ??
      bannerColors[0]

    setSelectedColorId(nextColor.id)
  }

  const handleCopy = async (payload: string, target: 'output' | 'command') => {
    try {
      await copyText(payload)
      setClipboardAction(target)
    } catch {
      setClipboardAction('copy-error')
    }
  }

  const handleCopyAnsiOutput = async () => {
    try {
      await copyText(bannerBundle.ansiOutput)
      setClipboardAction('ansi')
    } catch {
      setClipboardAction('copy-error')
    }
  }

  const handleCopyShareLink = async () => {
    try {
      const shareUrl = createBannerShareUrl({
        text: inputText,
        styleId: selectedStyleId,
        colorId: selectedColorId,
        trimTrailingSpaces,
        shell: activeShell,
      })

      await copyText(shareUrl)
      setClipboardAction('share')
    } catch {
      setClipboardAction('copy-error')
    }
  }

  const handlePaste = async () => {
    try {
      const pastedText = await readClipboardText()
      const normalizedText = pastedText
        .replace(/[\r\n\t]+/g, ' ')
        .slice(0, CHARACTER_LIMIT)

      setInputText(normalizedText)
      setClipboardAction('paste')
    } catch {
      setClipboardAction('paste-error')
    }
  }

  const handleDownload = () => {
    const exportBlob = new Blob([bannerBundle.output], {
      type: 'text/plain;charset=utf-8',
    })
    const objectUrl = URL.createObjectURL(exportBlob)
    const downloadLink = document.createElement('a')

    downloadLink.href = objectUrl
    downloadLink.download = `${bannerBundle.fileName}.txt`
    downloadLink.click()

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }

  const handleShortcuts = useEffectEvent((event: KeyboardEvent) => {
    if ((!event.metaKey && !event.ctrlKey) || !event.shiftKey || event.altKey) {
      return
    }

    const key = event.key.toLowerCase()

    if (key === 'c') {
      event.preventDefault()
      void handleCopy(currentCommand, 'command')
      return
    }

    if (key === 'v') {
      event.preventDefault()
      void handlePaste()
    }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleShortcuts(event)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-50">
      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,225,255,0.18),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(255,176,103,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(116,255,194,0.1),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.18),rgba(5,8,22,0.88))]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8 pt-6 text-center sm:pt-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-100/80 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Unicode Terminal Art Studio
          </div>

          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl lg:text-[4.5rem] lg:leading-[0.95]">
              Unicode Name Banner Generator
            </h1>
            <p className="mx-auto max-w-3xl text-balance text-base text-slate-300 sm:text-lg">
              Turn names, gamer tags, and short text into dense block-style
              Unicode banners, then copy the raw output or the exact shell
              command for Bash, zsh, or PowerShell.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-3 text-left sm:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-white/6 px-5 py-4 backdrop-blur-md">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Supported Set
              </div>
              <div className="mt-2 font-mono text-sm text-slate-100">
                A-Z, 0-9, space, dash, underscore
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/6 px-5 py-4 backdrop-blur-md">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Terminal Ready
              </div>
              <div className="mt-2 font-mono text-sm text-slate-100">
                `printf`, ANSI color, and PowerShell output
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/6 px-5 py-4 backdrop-blur-md">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Live Output
              </div>
              <div className="mt-2 font-mono text-sm text-slate-100">
                {bannerBundle.color.name} color, {bannerBundle.widestLine} cols
              </div>
            </div>
          </div>
        </header>

        <section className="surface-grid relative grid flex-1 gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/7 p-4 shadow-[0_30px_90px_rgba(3,6,18,0.55)] backdrop-blur-xl sm:p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={
              {
                '--style-accent': styleAccent,
              } as CSSProperties
            }
          >
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--style-accent)]/12 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
                    Input
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Type a name or short banner phrase
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300">
                  {inputText.length}/{CHARACTER_LIMIT}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label className="block flex-1">
                  <span className="sr-only">Banner text</span>
                  <input
                    type="text"
                    maxLength={CHARACTER_LIMIT}
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder="Type a name, team tag, or short phrase"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleGenerate()
                      }
                    }}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-slate-900/75 px-4 font-mono text-lg text-white outline-none transition focus:border-cyan-300/60 focus:bg-slate-900"
                  />
                </label>
                <ActionButton
                  icon={ClipboardPaste}
                  label={clipboardAction === 'paste' ? 'Pasted' : 'Paste'}
                  onClick={handlePaste}
                  variant="secondary"
                  className="h-14 justify-center px-5 sm:min-w-[118px]"
                  disabled={!canPasteFromClipboard}
                  title={
                    canPasteFromClipboard
                      ? 'Paste text from your clipboard.'
                      : 'Clipboard paste is unavailable in this browser.'
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {PRESET_EXAMPLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInputText(preset)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-100">
                    Trim trailing spaces
                  </div>
                  <div className="text-sm text-slate-400">
                    Cleaner copy/paste for most terminals and editors.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={trimTrailingSpaces}
                  aria-label="Trim trailing spaces"
                  onClick={() => setTrimTrailingSpaces((value) => !value)}
                  className={[
                    'relative inline-flex h-8 w-14 shrink-0 items-center overflow-hidden rounded-full border px-1 transition',
                    trimTrailingSpaces
                      ? 'border-cyan-300/50 bg-cyan-300/20'
                      : 'border-white/10 bg-white/8',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-200',
                      trimTrailingSpaces ? 'translate-x-6' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>
            </div>

            <StyleSelector
              selectedStyleId={selectedStyleId}
              onSelectStyle={setSelectedStyleId}
            />

            <ColorSelector
              selectedColorId={selectedColorId}
              onSelectColor={setSelectedColorId}
            />

            <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
              <div className="sr-only" role="status" aria-live="polite">
                {statusMessage}
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
                    Status
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Terminal fit and fallback notes
                  </h2>
                </div>
                <div
                  className={[
                    'rounded-full px-3 py-1.5 font-mono text-xs',
                    isWideBanner
                      ? 'border border-amber-300/25 bg-amber-300/10 text-amber-100'
                      : 'border border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
                  ].join(' ')}
                >
                  {isWideBanner ? 'Watch width' : 'Looks compact'}
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>{statusMessage}</p>
                <p>
                  Some terminals and fonts render Unicode block characters a bit
                  differently, so exact spacing may vary slightly.
                </p>
                <p>
                  Color affects the live preview and generated terminal command.
                  Raw copied output and `.txt` export stay plain Unicode text.
                </p>
                <p>
                  Bash and modern PowerShell terminals handle the color commands
                  best. Older shells may ignore ANSI styling.
                </p>
                <p>
                  Switch the command panel to `Save for future sessions` to
                  generate a startup-profile installer that restores the banner
                  whenever you open a new terminal window.
                </p>
                <p>
                  Use `Remove from future sessions` if you want a safe cleanup
                  command that removes only the banner block this app added.
                </p>
                <p>
                  Shortcuts: `Enter` generates, `Ctrl/Cmd+Shift+C` copies the
                  active command, and `Ctrl/Cmd+Shift+V` pastes clipboard text
                  into the input.
                </p>
                <p>
                  The URL stays in sync with your current setup, so `Copy Share
                  Link` sends the exact text, style, color, trim setting, and
                  shell tab.
                </p>
                {bannerBundle.unsupportedCharacters.length > 0 ? (
                  <p className="font-mono text-xs text-amber-100">
                    Replaced:{' '}
                    {bannerBundle.unsupportedCharacters
                      .map((character) => JSON.stringify(character))
                      .join(', ')}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap gap-3">
              <ActionButton
                icon={RefreshCcw}
                label="Generate"
                onClick={handleGenerate}
              />
              <ActionButton
                icon={Shuffle}
                label="Random Style"
                onClick={handleRandomStyle}
                variant="secondary"
              />
              <ActionButton
                icon={Shuffle}
                label="Random Color"
                onClick={handleRandomColor}
                variant="secondary"
              />
              <ActionButton
                icon={Download}
                label="Download .txt"
                onClick={handleDownload}
                variant="ghost"
              />
              <ActionButton
                icon={Link2}
                label={clipboardAction === 'share' ? 'Link Copied' : 'Copy Share Link'}
                onClick={handleCopyShareLink}
                variant="ghost"
              />
            </div>

            <PreviewPanel
              banner={bannerBundle}
              isCopied={clipboardAction === 'output'}
              isAnsiCopied={clipboardAction === 'ansi'}
              onCopyOutput={() => handleCopy(bannerBundle.output, 'output')}
              onCopyAnsiOutput={handleCopyAnsiOutput}
            />

            <CommandTabs
              activeShell={activeShell}
              commandMode={commandMode}
              commandBundle={bannerBundle.commands}
              isCopied={clipboardAction === 'command'}
              onChangeShell={setActiveShell}
              onChangeMode={setCommandMode}
              onCopyCommand={() => handleCopy(currentCommand, 'command')}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
