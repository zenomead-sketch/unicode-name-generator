import type { BannerColor, BannerColorId } from '../types/banner'

export const bannerColors: BannerColor[] = [
  {
    id: 'plain',
    name: 'Plain',
    previewHex: '#f8fafc',
  },
  {
    id: 'red',
    name: 'Red',
    previewHex: '#ff7a7a',
    bashAnsiCode: '31',
    powershellName: 'Red',
  },
  {
    id: 'green',
    name: 'Green',
    previewHex: '#79f2a3',
    bashAnsiCode: '32',
    powershellName: 'Green',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    previewHex: '#ffd86b',
    bashAnsiCode: '33',
    powershellName: 'Yellow',
  },
  {
    id: 'blue',
    name: 'Blue',
    previewHex: '#7ab8ff',
    bashAnsiCode: '34',
    powershellName: 'Blue',
  },
  {
    id: 'magenta',
    name: 'Magenta',
    previewHex: '#ff86e1',
    bashAnsiCode: '35',
    powershellName: 'Magenta',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    previewHex: '#6ce8ff',
    bashAnsiCode: '36',
    powershellName: 'Cyan',
  },
  {
    id: 'white',
    name: 'White',
    previewHex: '#ffffff',
    bashAnsiCode: '97',
    powershellName: 'White',
  },
]

export const bannerColorMap: Record<BannerColorId, BannerColor> =
  bannerColors.reduce(
    (colorMap, color) => {
      colorMap[color.id] = color
      return colorMap
    },
    {} as Record<BannerColorId, BannerColor>,
  )
