import { bannerColorMap } from '../data/bannerColors'
import { glyphPatterns } from '../data/glyphPatterns'
import { bannerStyleMap } from '../data/renderStyles'
import type {
  BannerColor,
  BannerColorId,
  BannerStyle,
  BannerStyleId,
  GlyphNeighbors,
  PixelGlyph,
  RenderedBannerBundle,
} from '../types/banner'

const GLYPH_HEIGHT = 5
const FALLBACK_CHARACTER = '?'

interface BannerOptions {
  readonly text: string
  readonly styleId: BannerStyleId
  readonly colorId: BannerColorId
  readonly trimTrailingSpaces: boolean
}

function normalizeInput(rawText: string) {
  const sanitized = rawText.replace(/[\r\n\t]+/g, ' ')
  const uppercase = sanitized.toUpperCase()
  const unsupportedCharacters = Array.from(new Set(Array.from(uppercase))).filter(
    (character) => !glyphPatterns[character],
  )

  return {
    normalizedInput: uppercase,
    unsupportedCharacters,
  }
}

function getGlyphForCharacter(character: string): PixelGlyph {
  return glyphPatterns[character] ?? glyphPatterns[FALLBACK_CHARACTER]
}

function getNeighbors(
  glyph: PixelGlyph,
  row: number,
  column: number,
): GlyphNeighbors {
  return {
    top: row > 0 && glyph[row - 1][column] === '1',
    right: column < glyph[row].length - 1 && glyph[row][column + 1] === '1',
    bottom: row < glyph.length - 1 && glyph[row + 1][column] === '1',
    left: column > 0 && glyph[row][column - 1] === '1',
  }
}

function pickFilledToken(
  style: BannerStyle,
  row: number,
  column: number,
  neighbors: GlyphNeighbors,
) {
  const { tokens } = style
  const parity = (row + column) % 2 === 0

  if (!neighbors.top && !neighbors.left && neighbors.bottom && neighbors.right) {
    return tokens.topLeft
  }

  if (!neighbors.top && !neighbors.right && neighbors.bottom && neighbors.left) {
    return tokens.topRight
  }

  if (!neighbors.bottom && !neighbors.left && neighbors.top && neighbors.right) {
    return tokens.bottomLeft
  }

  if (!neighbors.bottom && !neighbors.right && neighbors.top && neighbors.left) {
    return tokens.bottomRight
  }

  if (!neighbors.top && neighbors.bottom) {
    return tokens.top
  }

  if (!neighbors.bottom && neighbors.top) {
    return tokens.bottom
  }

  if (!neighbors.left && neighbors.right) {
    return parity && tokens.leftAlt ? tokens.leftAlt : tokens.left
  }

  if (!neighbors.right && neighbors.left) {
    return parity && tokens.rightAlt ? tokens.rightAlt : tokens.right
  }

  if (!neighbors.top && !neighbors.bottom && (neighbors.left || neighbors.right)) {
    return tokens.horizontal
  }

  if (!neighbors.left && !neighbors.right && (neighbors.top || neighbors.bottom)) {
    return tokens.vertical
  }

  if (!neighbors.top && !neighbors.right && !neighbors.bottom && !neighbors.left) {
    return tokens.isolated
  }

  if (parity && tokens.checkerA) {
    return tokens.checkerA
  }

  if (!parity && tokens.checkerB) {
    return tokens.checkerB
  }

  return tokens.full
}

function renderGlyphRow(glyph: PixelGlyph, row: number, style: BannerStyle) {
  return glyph[row]
    .split('')
    .map((bit, column) => {
      if (bit !== '1') {
        return style.empty
      }

      return pickFilledToken(style, row, column, getNeighbors(glyph, row, column))
    })
    .join('')
}

function sanitizeFileName(text: string) {
  const cleaned = text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9_-]/g, '')

  return cleaned.slice(0, 24) || 'unicode-banner'
}

function escapeForBash(text: string) {
  return text.replace(/'/g, `'\\''`)
}

function escapeForPowerShell(text: string) {
  return text.replace(/'/g, `''`)
}

function createAnsiOutput(output: string, color: BannerColor) {
  if (!color.bashAnsiCode) {
    return output
  }

  return `\u001b[${color.bashAnsiCode}m${output}\u001b[0m`
}

function createCommands(lines: string[], color: BannerColor) {
  const bashArgs = lines.map((line) => `'${escapeForBash(line)}'`).join(' ')
  const powershellLines = lines
    .map((line) => `  '${escapeForPowerShell(line)}'`)
    .join(',\n')

  const bash =
    color.bashAnsiCode
      ? `printf '\\033[${color.bashAnsiCode}m%s\\033[0m\\n' ${bashArgs}`
      : `printf '%s\\n' ${bashArgs}`

  const powershell =
    color.powershellName
      ? `@(\n${powershellLines}\n) | ForEach-Object { Write-Host $_ -ForegroundColor ${color.powershellName} }`
      : `Write-Output @(\n${powershellLines}\n)`

  return {
    bash,
    powershell,
  }
}

export function createBannerBundle({
  text,
  styleId,
  colorId,
  trimTrailingSpaces,
}: BannerOptions): RenderedBannerBundle {
  const style = bannerStyleMap[styleId]
  const color = bannerColorMap[colorId]
  const { normalizedInput, unsupportedCharacters } = normalizeInput(text)
  const characters = Array.from(normalizedInput || ' ')

  const lines = Array.from({ length: GLYPH_HEIGHT }, (_, rowIndex) => {
    const renderedLine = characters
      .map((character) => {
        if (character === ' ') {
          return style.wordGap
        }

        return renderGlyphRow(getGlyphForCharacter(character), rowIndex, style)
      })
      .join(style.gap)

    return trimTrailingSpaces ? renderedLine.trimEnd() : renderedLine
  })

  const output = lines.join('\n')

  return {
    input: text,
    normalizedInput,
    lines,
    output,
    ansiOutput: createAnsiOutput(output, color),
    widestLine: lines.reduce(
      (maximumWidth, line) => Math.max(maximumWidth, line.length),
      0,
    ),
    unsupportedCharacters,
    fileName: sanitizeFileName(normalizedInput),
    style,
    color,
    commands: createCommands(lines, color),
  }
}
