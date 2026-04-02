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
const PROFILE_START_MARKER = '# >>> unicode-name-banner-generator >>>'
const PROFILE_END_MARKER = '# <<< unicode-name-banner-generator <<<'

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

function createRunCommands(lines: string[], color: BannerColor) {
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

function createBashProfileCommand(runCommand: string) {
  const block = `${PROFILE_START_MARKER}\n${runCommand}\n${PROFILE_END_MARKER}`

  return [
    `PYTHON_BIN="$(command -v python3 || command -v python)"`,
    `[ -n "$PYTHON_BIN" ] || { echo "Python is required to update your shell profile." >&2; exit 1; }`,
    `"$PYTHON_BIN" - <<'PY'`,
    `from pathlib import Path`,
    `start = ${JSON.stringify(PROFILE_START_MARKER)}`,
    `end = ${JSON.stringify(PROFILE_END_MARKER)}`,
    `block = ${JSON.stringify(block)}`,
    `for profile_name in ('.bashrc', '.zshrc'):`,
    `    path = Path.home() / profile_name`,
    `    text = path.read_text(encoding='utf-8') if path.exists() else ''`,
    `    if start in text and end in text:`,
    `        before, _, rest = text.partition(start)`,
    `        _, _, after = rest.partition(end)`,
    `        updated = before.rstrip('\\n') + '\\n\\n' + block + '\\n' + after.lstrip('\\n')`,
    `    elif text.strip():`,
    `        updated = text.rstrip('\\n') + '\\n\\n' + block + '\\n'`,
    `    else:`,
    `        updated = block + '\\n'`,
    `    path.write_text(updated, encoding='utf-8')`,
    `print('Saved banner to ~/.bashrc and ~/.zshrc')`,
    `PY`,
    `printf 'Open a new terminal window to load the banner.\\n'`,
  ].join('\n')
}

function createBashProfileRemovalCommand() {
  return [
    `PYTHON_BIN="$(command -v python3 || command -v python)"`,
    `[ -n "$PYTHON_BIN" ] || { echo "Python is required to update your shell profile." >&2; exit 1; }`,
    `"$PYTHON_BIN" - <<'PY'`,
    `from pathlib import Path`,
    `start = ${JSON.stringify(PROFILE_START_MARKER)}`,
    `end = ${JSON.stringify(PROFILE_END_MARKER)}`,
    `for profile_name in ('.bashrc', '.zshrc'):`,
    `    path = Path.home() / profile_name`,
    `    if not path.exists():`,
    `        continue`,
    `    text = path.read_text(encoding='utf-8')`,
    `    if start not in text or end not in text:`,
    `        continue`,
    `    before, _, rest = text.partition(start)`,
    `    _, _, after = rest.partition(end)`,
    `    before = before.rstrip('\\n')`,
    `    after = after.lstrip('\\n')`,
    `    if before and after:`,
    `        updated = before + '\\n\\n' + after`,
    `    elif before:`,
    `        updated = before + '\\n'`,
    `    else:`,
    `        updated = after`,
    `    path.write_text(updated, encoding='utf-8')`,
    `print('Removed saved banner block from ~/.bashrc and ~/.zshrc when present')`,
    `PY`,
  ].join('\n')
}

function createPowerShellProfileCommand(runCommand: string) {
  return [
    `$profilePath = $PROFILE.CurrentUserAllHosts`,
    `if (-not $profilePath) { $profilePath = $PROFILE }`,
    `$startMarker = '${escapeForPowerShell(PROFILE_START_MARKER)}'`,
    `$endMarker = '${escapeForPowerShell(PROFILE_END_MARKER)}'`,
    `$block = @'`,
    PROFILE_START_MARKER,
    runCommand,
    PROFILE_END_MARKER,
    `'@`,
    `$profileDir = Split-Path -Parent $profilePath`,
    `if ($profileDir -and -not (Test-Path $profileDir)) { New-Item -ItemType Directory -Path $profileDir -Force | Out-Null }`,
    `$current = if (Test-Path $profilePath) { Get-Content $profilePath -Raw } else { '' }`,
    `$pattern = '(?s)' + [regex]::Escape($startMarker) + '.*?' + [regex]::Escape($endMarker)`,
    `if ($current -match $pattern) {`,
    `  $updated = [regex]::Replace($current, $pattern, $block)`,
    `} elseif ([string]::IsNullOrWhiteSpace($current)) {`,
    `  $updated = $block`,
    `} else {`,
    `  $updated = $current.TrimEnd() + "\`r\`n\`r\`n" + $block`,
    `}`,
    `Set-Content -Path $profilePath -Value $updated -Encoding utf8`,
    `Write-Host "Saved banner to $profilePath. Open a new terminal window to load it."`,
  ].join('\n')
}

function createPowerShellProfileRemovalCommand() {
  return [
    `$profilePath = $PROFILE.CurrentUserAllHosts`,
    `if (-not $profilePath) { $profilePath = $PROFILE }`,
    `$startMarker = '${escapeForPowerShell(PROFILE_START_MARKER)}'`,
    `$endMarker = '${escapeForPowerShell(PROFILE_END_MARKER)}'`,
    `if (-not (Test-Path $profilePath)) {`,
    `  Write-Host "No PowerShell profile was found at $profilePath."`,
    `  return`,
    `}`,
    `$current = Get-Content $profilePath -Raw`,
    `$pattern = '(?s)\r?\n?' + [regex]::Escape($startMarker) + '.*?' + [regex]::Escape($endMarker) + '\r?\n?'`,
    `if ($current -match $pattern) {`,
    `  $updated = [regex]::Replace($current, $pattern, '')`,
    `  $updated = $updated.TrimEnd()`,
    `  if ($updated.Length -gt 0) { $updated += "\`r\`n" }`,
    `  Set-Content -Path $profilePath -Value $updated -Encoding utf8`,
    `  Write-Host "Removed the saved banner block from $profilePath."`,
    `} else {`,
    `  Write-Host "No saved banner block was found in $profilePath."`,
    `}`,
  ].join('\n')
}

function createCommands(lines: string[], color: BannerColor) {
  const runCommands = createRunCommands(lines, color)

  return {
    bash: {
      run: runCommands.bash,
      profile: createBashProfileCommand(runCommands.bash),
      remove: createBashProfileRemovalCommand(),
    },
    powershell: {
      run: runCommands.powershell,
      profile: createPowerShellProfileCommand(runCommands.powershell),
      remove: createPowerShellProfileRemovalCommand(),
    },
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
