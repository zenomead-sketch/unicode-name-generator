import { bannerColorMap } from '../data/bannerColors'
import { bannerStyleMap } from '../data/renderStyles'
import type {
  BannerColorId,
  BannerStyleId,
  CommandShell,
} from '../types/banner'

const MAX_SHARED_TEXT_LENGTH = 32

export interface BannerShareState {
  readonly text: string
  readonly styleId: BannerStyleId
  readonly colorId: BannerColorId
  readonly trimTrailingSpaces: boolean
  readonly shell: CommandShell
}

function sanitizeSharedText(text: string) {
  return text.replace(/[\r\n\t]+/g, ' ').slice(0, MAX_SHARED_TEXT_LENGTH)
}

function buildSharedUrl(state: BannerShareState) {
  const url = new URL(window.location.href)

  url.searchParams.set('text', sanitizeSharedText(state.text))
  url.searchParams.set('style', state.styleId)
  url.searchParams.set('color', state.colorId)
  url.searchParams.set('trim', state.trimTrailingSpaces ? '1' : '0')
  url.searchParams.set('shell', state.shell)

  return url
}

export function readBannerShareState(
  defaults: BannerShareState,
): BannerShareState {
  if (typeof window === 'undefined') {
    return defaults
  }

  const url = new URL(window.location.href)
  const text = url.searchParams.get('text')
  const style = url.searchParams.get('style')
  const color = url.searchParams.get('color')
  const trim = url.searchParams.get('trim')
  const shell = url.searchParams.get('shell')

  return {
    text: text === null ? defaults.text : sanitizeSharedText(text),
    styleId:
      style && style in bannerStyleMap
        ? (style as BannerStyleId)
        : defaults.styleId,
    colorId:
      color && color in bannerColorMap
        ? (color as BannerColorId)
        : defaults.colorId,
    trimTrailingSpaces:
      trim === null ? defaults.trimTrailingSpaces : trim !== '0',
    shell:
      shell === 'powershell' || shell === 'bash' ? shell : defaults.shell,
  }
}

export function writeBannerShareState(state: BannerShareState) {
  if (typeof window === 'undefined') {
    return
  }

  const url = buildSharedUrl(state)

  window.history.replaceState(null, '', url)
}

export function createBannerShareUrl(state: BannerShareState) {
  if (typeof window === 'undefined') {
    return ''
  }

  return buildSharedUrl(state).toString()
}
