import type { Book, BookStatus } from '../types/book';

export interface SpinePalette {
  bg: string;
  gradient?: string;
  text: string;
  titleColor?: string;
  isLight: boolean;
}

export interface SpineFormat {
  width: number;
  height: number;
  formatLabel: string;
}

export const DEFAULT_SPINE_FORMAT: SpineFormat = {
  width: 24,
  height: 146,
  formatLabel: 'MANGA',
};

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSpineDisplayTitle(title: string): string {
  if (!title) return '';

  let clean = title
    .split(/\s*[:–—;]\s*|\s+-\s+|,\s*(?:vol|volume|ch|chapter|edition|part|book)\b|(?:\s*[([{\u3010\uFF08\u300C\u300E])/i)[0]
    .trim();

  if (clean.length > 16) {
    const truncated = clean.slice(0, 16);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace >= 4) {
      clean = truncated.slice(0, lastSpace).trim() + '…';
    } else {
      clean = clean.slice(0, 15).trim() + '…';
    }
  }

  return clean || title;
}

export interface SoftPaletteSwatch {
  name: string;
  hex: string;
}

export const BOOKSTORE_SOFT_PALETTE: SoftPaletteSwatch[] = [
  { name: 'Terracotta', hex: '#C76B52' },
  { name: 'Muted red', hex: '#A94743' },
  { name: 'Amber', hex: '#D19A42' },
  { name: 'Mustard', hex: '#C5AA43' },
  { name: 'Sage', hex: '#82977A' },
  { name: 'Forest', hex: '#477A6A' },
  { name: 'Dusty blue', hex: '#6397AD' },
  { name: 'Navy', hex: '#405D78' },
  { name: 'Sand', hex: '#C7AC88' },
  { name: 'Taupe', hex: '#A68C75' },
  { name: 'Cream', hex: '#E3D5BD' },
  { name: 'Charcoal', hex: '#55514C' },

  { name: 'Rust', hex: '#B8583B' },
  { name: 'Crimson Matte', hex: '#8F3835' },
  { name: 'Dusty Rose', hex: '#B86878' },
  { name: 'Muted Plum', hex: '#7D4D6E' },
  { name: 'Dusty Violet', hex: '#655075' },
  { name: 'Deep Lavender', hex: '#806888' },
  { name: 'Slate Teal', hex: '#4A7A7B' },
  { name: 'Deep Spruce', hex: '#345950' },
  { name: 'Olive', hex: '#73835B' },
  { name: 'Warm Matcha', hex: '#8C9A6F' },
  { name: 'Warm Ochre', hex: '#C28938' },
  { name: 'Warm Caramel', hex: '#B8723C' },
  { name: 'Slate Blue', hex: '#4D6B82' },
  { name: 'Deep Indigo', hex: '#35455E' },
  { name: 'Warm Cedar', hex: '#8C644B' },
  { name: 'Warm Ivory', hex: '#ECE3D0' },
  { name: 'Sumi Ink', hex: '#373432' },
];

export const CHROMATIC_SOFT_PALETTE: string[] = BOOKSTORE_SOFT_PALETTE.map((s) => s.hex);

export function hexToHsl(h: string): [number, number, number] {
  const clean = h.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let sVal = 0;
  const lVal = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    sVal = lVal > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hVal = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hVal = (b - r) / d + 2; break;
      case b: hVal = (r - g) / d + 4; break;
    }
    hVal *= 60;
  }
  return [hVal, sVal, lVal];
}

export function hslToHex(h: number, s: number, l: number): string {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(1, s));
  const normL = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * normL - 1)) * normS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normL - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (normH < 60) { r = c; g = x; }
  else if (normH < 120) { r = x; g = c; }
  else if (normH < 180) { g = c; b = x; }
  else if (normH < 240) { g = x; b = c; }
  else if (normH < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const PRECOMPUTED_SWATCHES = BOOKSTORE_SOFT_PALETTE.map((swatch) => {
  const [h, s, l] = hexToHsl(swatch.hex);
  return { hex: swatch.hex, h, s, l };
});

const softPaletteCache = new Map<string, string>();

export function mapToSoftPalette(baseColorHex: string): string {
  const cleanHex = baseColorHex.trim();
  const hex = cleanHex.startsWith('#') ? cleanHex : `#${cleanHex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return '#A68C75';
  }

  const upperHex = hex.toUpperCase();
  const cached = softPaletteCache.get(upperHex);
  if (cached) return cached;

  const [h1, s1, l1] = hexToHsl(hex);

  if (l1 < 0.18) {
    return '#373432'; // Sumi Ink
  }
  if (l1 > 0.88 && s1 < 0.25) {
    return '#ECE3D0'; // Warm Ivory
  }
  if (s1 < 0.18) {
    if (l1 > 0.72) return '#E3D5BD'; // Cream
    if (l1 > 0.58) return '#C7AC88'; // Sand
    if (l1 > 0.42) return '#A68C75'; // Taupe
    return '#55514C'; // Charcoal
  }

  let bestHex = PRECOMPUTED_SWATCHES[0].hex;
  let minScore = Infinity;

  for (const swatch of PRECOMPUTED_SWATCHES) {
    let dH = Math.abs(h1 - swatch.h);
    if (dH > 180) dH = 360 - dH;

    const rad = (dH * Math.PI) / 180;
    const hueDist = (1 - Math.cos(rad)) * 90;
    const lumDist = Math.abs(l1 - swatch.l) * 35;
    const satDist = Math.abs(s1 - swatch.s) * 15;

    const totalScore = hueDist + lumDist + satDist;
    if (totalScore < minScore) {
      minScore = totalScore;
      bestHex = swatch.hex;
    }
  }

  softPaletteCache.set(upperHex, bestHex);
  return bestHex;
}

const surfaceGradientCache = new Map<string, string>();

export function getSpineSurfaceGradient(colorHex: string): string {
  const cached = surfaceGradientCache.get(colorHex);
  if (cached) return cached;

  const [h, s, l] = hexToHsl(colorHex);
  const topColor = hslToHex(h + 1.5, s * 0.96, l + 0.045);
  const bottomColor = hslToHex(h - 1.5, s * 1.02, l - 0.04);
  const grad = `linear-gradient(180deg, ${topColor} 0%, ${colorHex} 60%, ${bottomColor} 100%)`;
  surfaceGradientCache.set(colorHex, grad);
  return grad;
}

export function getSpinePalette(
  book: Book,
  titleIndex?: number,
  shelfBaseColor?: string
): SpinePalette {
  const rawColor = (shelfBaseColor || book.spineColor)?.trim();
  const hex = rawColor ? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`) : '';
  const hasValidHex = /^#[0-9A-Fa-f]{6}$/.test(hex) && hex.toUpperCase() !== '#8B5A2B';

  let titleColor: string;
  if (hasValidHex) {
    titleColor = mapToSoftPalette(hex);
  } else {
    const offset = typeof titleIndex === 'number' ? titleIndex : 0;
    const colorIndex = (14 + offset) % CHROMATIC_SOFT_PALETTE.length;
    titleColor = CHROMATIC_SOFT_PALETTE[colorIndex];
  }

  const surfaceGradient = getSpineSurfaceGradient(titleColor);

  const r = parseInt(titleColor.slice(1, 3), 16);
  const g = parseInt(titleColor.slice(3, 5), 16);
  const b = parseInt(titleColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.6;
  const ink = isLight ? '#221E1B' : '#F4EFE6';

  return {
    bg: titleColor,
    gradient: surfaceGradient,
    text: ink,
    titleColor: ink,
    isLight,
  };
}

export function getSpineFormat(_book?: Book): SpineFormat {
  return DEFAULT_SPINE_FORMAT;
}

export function getSpineVolumeInfo(book: Book, volumeNumber?: number): { badgeText: string; tooltipText: string } {
  if (typeof volumeNumber === 'number' && volumeNumber > 0) {
    return { badgeText: String(volumeNumber), tooltipText: `Vol. ${volumeNumber}` };
  }

  if (typeof book.volume === 'number' && book.volume > 0) {
    return { badgeText: String(book.volume), tooltipText: `Vol. ${book.volume}` };
  }

  const titleVolMatch = book.title.match(/(?:vol(?:ume)?\.?|#)\s*(\d+)/i);
  if (titleVolMatch) {
    const num = parseInt(titleVolMatch[1], 10);
    return { badgeText: String(num), tooltipText: `Vol. ${num}` };
  }

  if (typeof book.chapter === 'number' && book.chapter > 0) {
    return { badgeText: `${book.chapter}`, tooltipText: `Ch. ${book.chapter}` };
  }

  return { badgeText: '1', tooltipText: 'Vol. 1' };
}

export function getSpineColorSortScore(hex?: string): number {
  if (!hex) return 5000;
  const clean = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(clean)) return 5000;

  const [h, s, l] = hexToHsl(clean);

  if (l >= 0.88 || (s < 0.08 && l > 0.80)) {
    return 100 + (1 - l) * 50;
  }

  if (l <= 0.16 || (s < 0.08 && l < 0.25)) {
    return 9000 + l * 100;
  }

  if (s < 0.10) {
    return 8000 + (1 - l) * 100;
  }

  const isBrown = h >= 15 && h <= 45 && l <= 0.45 && s <= 0.55;
  if (isBrown) {
    return 7000 + (1 - l) * 100;
  }

  return 1000 + h * 15 + (1 - l) * 5;
}

export function getBookOwnedVolumes(book: Book): number[] {
  if (Array.isArray(book.ownedVolumes) && book.ownedVolumes.length > 0) {
    const arr = book.ownedVolumes;
    let isSorted = true;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) {
        isSorted = false;
        break;
      }
    }
    return isSorted ? arr : [...arr].sort((a, b) => a - b);
  }
  const count = Math.max(
    1,
    typeof book.volume === 'number' && book.volume > 0
      ? book.volume
      : (book.volumesOwned ?? 1)
  );
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getBookReadVolumes(book: Book): number[] {
  const owned = getBookOwnedVolumes(book);
  const ownedSet = new Set(owned);

  if (Array.isArray(book.readVolumes) && book.readVolumes.length > 0) {
    return book.readVolumes.filter((v) => ownedSet.has(v)).sort((a, b) => a - b);
  }

  if (typeof book.volume === 'number' && book.volume > 0 && book.status !== 'want-to-read') {
    return Array.from({ length: book.volume }, (_, i) => i + 1).filter((v) => ownedSet.has(v));
  }

  return [];
}

export function getVolumeStatus(
  book: Book,
  volNum: number,
  readSet?: Set<number>
): Exclude<BookStatus, 'none'> {
  const isRead = readSet ? readSet.has(volNum) : getBookReadVolumes(book).includes(volNum);
  if (isRead) {
    return 'finished';
  }

  if (book.status === 'finished') {
    return 'on-hold';
  }

  if (book.status === 'reading') {
    return 'reading';
  }

  if (book.status === 'on-hold') {
    return 'on-hold';
  }

  return 'want-to-read';
}
