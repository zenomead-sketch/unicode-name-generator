export type BannerStyleId =
  | 'heavy'
  | 'rounded'
  | 'diagonal'
  | 'outline'
  | 'mosaic'
  | 'scan'
export type CommandShell = 'bash' | 'powershell'
export type CommandMode = 'run' | 'profile'
export type BannerColorId =
  | 'plain'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'

export type PixelGlyph = readonly [string, string, string, string, string]

export interface GlyphRecord {
  readonly [character: string]: PixelGlyph
}

export interface GlyphNeighbors {
  readonly top: boolean
  readonly right: boolean
  readonly bottom: boolean
  readonly left: boolean
}

export interface BannerStyleTokens {
  readonly full: string
  readonly checkerA?: string
  readonly checkerB?: string
  readonly top: string
  readonly bottom: string
  readonly left: string
  readonly leftAlt?: string
  readonly right: string
  readonly rightAlt?: string
  readonly topLeft: string
  readonly topRight: string
  readonly bottomLeft: string
  readonly bottomRight: string
  readonly horizontal: string
  readonly vertical: string
  readonly isolated: string
}

export interface BannerStyle {
  readonly id: BannerStyleId
  readonly name: string
  readonly description: string
  readonly accent: string
  readonly gap: string
  readonly wordGap: string
  readonly empty: string
  readonly tokens: BannerStyleTokens
}

export interface BannerColor {
  readonly id: BannerColorId
  readonly name: string
  readonly previewHex: string
  readonly bashAnsiCode?: string
  readonly powershellName?: string
}

export interface ShellCommandSet {
  readonly run: string
  readonly profile: string
}

export interface CommandBundle {
  readonly bash: ShellCommandSet
  readonly powershell: ShellCommandSet
}

export interface RenderedBannerBundle {
  readonly input: string
  readonly normalizedInput: string
  readonly lines: string[]
  readonly output: string
  readonly ansiOutput: string
  readonly widestLine: number
  readonly unsupportedCharacters: string[]
  readonly fileName: string
  readonly style: BannerStyle
  readonly color: BannerColor
  readonly commands: CommandBundle
}
