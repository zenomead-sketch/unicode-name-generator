# Unicode Name Banner Generator

Unicode Name Banner Generator is a production-ready client-side React + TypeScript app for turning short text into dense Unicode terminal art. It ships with live preview, multiple Unicode style packs, ANSI color support, Bash/zsh and PowerShell command generation, shareable URLs, terminal width checks, one-click clipboard actions, and `.txt` export.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## File Structure

```text
src/
  components/
    ActionButton.tsx
    ColorSelector.tsx
    CommandTabs.tsx
    PreviewPanel.tsx
    StyleSelector.tsx
  data/
    bannerColors.ts
    glyphPatterns.ts
    renderStyles.ts
  lib/
    bannerRenderer.ts
    clipboard.ts
    shareState.ts
  types/
    banner.ts
  App.tsx
  index.css
  main.tsx
```

## What Ships

- 6 Unicode rendering styles
- Plain plus 7 basic terminal colors
- Raw output copy, ANSI output copy, command copy, and paste support
- Share links that preserve text, style, color, shell tab, and trim settings
- Width-fit badges for 80, 100, and 120 column terminals
- `.txt` export for the plain Unicode banner

## How The Renderer Works

1. `glyphPatterns.ts` stores each supported character as a compact 5x5 bitmap.
2. `renderStyles.ts` defines style tokens such as heavy blocks, rounded dots, diagonal shading, outline, mosaic, and scan-grid variants.
3. `bannerRenderer.ts` normalizes input, swaps unsupported characters to a fallback glyph, inspects neighboring pixels, and chooses the best Unicode token for each filled cell.
4. The same rendered lines are reused for the preview, copied output, ANSI output, `.txt` export, and generated terminal commands so every surface stays in sync.
5. `clipboard.ts` adds a fallback copy path so the app behaves more reliably outside ideal clipboard environments.

## Notes

- Supported input is currently `A-Z`, `a-z`, `0-9`, space, dash, and underscore.
- Lowercase input is normalized to uppercase for glyph lookup.
- Unsupported characters fall back gracefully.
- Some terminals and fonts render Unicode block glyphs with slightly different spacing.
