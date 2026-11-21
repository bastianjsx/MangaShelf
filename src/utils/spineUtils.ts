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
  return hash === -2147483648 ? 2147483647 : Math.abs(hash);
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

export type ColorFamily =
  | 'red'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'neutral';

export interface SoftPaletteSwatch {
  name: string;
  hex: string;
  family: ColorFamily;
  priority: number;
}

export const BOOKSTORE_SOFT_PALETTE: SoftPaletteSwatch[] = [
  // Red
  { name: 'Crimson Matte', hex: '#8F3835', family: 'red', priority: 1 },
  { name: 'Muted red', hex: '#A94743', family: 'red', priority: 2 },
  { name: 'Rust', hex: '#B8583B', family: 'red', priority: 3 },
  { name: 'Terracotta', hex: '#C76B52', family: 'red', priority: 4 },

  // Pink
  { name: 'Dusty Rose', hex: '#B86878', family: 'pink', priority: 1 },

  // Orange
  { name: 'Warm Caramel', hex: '#B8723C', family: 'orange', priority: 1 },

  // Yellow / Gold
  { name: 'Warm Ochre', hex: '#C28938', family: 'yellow', priority: 1 },
  { name: 'Amber', hex: '#D19A42', family: 'yellow', priority: 2 },
  { name: 'Mustard', hex: '#C5AA43', family: 'yellow', priority: 3 },

  // Green
  { name: 'Forest', hex: '#477A6A', family: 'green', priority: 1 },
  { name: 'Deep Spruce', hex: '#345950', family: 'green', priority: 2 },
  { name: 'Olive', hex: '#73835B', family: 'green', priority: 3 },
  { name: 'Warm Matcha', hex: '#8C9A6F', family: 'green', priority: 4 },
  { name: 'Sage', hex: '#82977A', family: 'green', priority: 5 },

  // Teal
  { name: 'Slate Teal', hex: '#4A7A7B', family: 'teal', priority: 1 },

  // Blue
  { name: 'Navy', hex: '#405D78', family: 'blue', priority: 1 },
  { name: 'Deep Indigo', hex: '#35455E', family: 'blue', priority: 2 },
  { name: 'Slate Blue', hex: '#4D6B82', family: 'blue', priority: 3 },
  { name: 'Dusty blue', hex: '#6397AD', family: 'blue', priority: 4 },

  // Purple
  { name: 'Muted Plum', hex: '#7D4D6E', family: 'purple', priority: 1 },
  { name: 'Deep Lavender', hex: '#806888', family: 'purple', priority: 2 },
  { name: 'Dusty Violet', hex: '#655075', family: 'purple', priority: 3 },

  // Brown
  { name: 'Warm Cedar', hex: '#8C644B', family: 'brown', priority: 1 },
  { name: 'Taupe', hex: '#A68C75', family: 'brown', priority: 2 },
  { name: 'Sand', hex: '#C7AC88', family: 'brown', priority: 3 },

  // Neutral
  { name: 'Charcoal', hex: '#55514C', family: 'neutral', priority: 1 },
  { name: 'Sumi Ink', hex: '#373432', family: 'neutral', priority: 2 },
  { name: 'Cream', hex: '#E3D5BD', family: 'neutral', priority: 3 },
  { name: 'Warm Ivory', hex: '#ECE3D0', family: 'neutral', priority: 4 },
];

export const FAMILY_DEFAULTS: Record<ColorFamily, string> = {
  red: '#8F3835', // Crimson Matte
  pink: '#B86878', // Dusty Rose
  orange: '#B8723C', // Warm Caramel
  yellow: '#C28938', // Warm Ochre
  green: '#477A6A', // Forest
  teal: '#4A7A7B', // Slate Teal
  blue: '#405D78', // Navy
  purple: '#7D4D6E', // Muted Plum
  brown: '#8C644B', // Warm Cedar
  neutral: '#A68C75', // Taupe
};

export const CHROMATIC_SOFT_PALETTE: string[] = BOOKSTORE_SOFT_PALETTE.map((s) => s.hex);

export function hexToHsl(h: string): [number, number, number] {
  if (typeof h !== 'string') return [0, 0, 0];
  let clean = h.replace('#', '').trim();
  if (clean.length === 3 && /^[0-9A-Fa-f]{3}$/.test(clean)) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return [0, 0, 0];
  }
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
  return { ...swatch, h, s, l };
});

const softPaletteCache = new Map<string, string>();

export function getColorFamily(hex: string): ColorFamily {
  const [h, s, l] = hexToHsl(hex);

  // Low saturation or extreme lightness is neutral
  if (s < 0.12 || l < 0.14 || l > 0.92) {
    return 'neutral';
  }

  // Brown detection for earthy, low-to-medium lightness warm tones
  if (h >= 15 && h <= 45 && l <= 0.45 && s <= 0.55) {
    return 'brown';
  }

  // Hue-based classification
  if ((h >= 345 && h <= 360) || (h >= 0 && h < 15)) {
    return 'red';
  }
  if (h >= 15 && h < 40) {
    return 'orange';
  }
  if (h >= 40 && h < 65) {
    return 'yellow';
  }
  if (h >= 65 && h < 160) {
    return 'green';
  }
  if (h >= 160 && h < 195) {
    return 'teal';
  }
  if (h >= 195 && h < 255) {
    return 'blue';
  }
  if (h >= 255 && h < 290) {
    return 'purple';
  }
  if (h >= 290 && h < 345) {
    return 'pink';
  }

  return 'neutral';
}

export interface SpineColorContext {
  title?: string;
  titleIndex?: number;
  volumeNumber?: number;
}

export function mapToSoftPalette(
  baseColorHex: string,
  context?: SpineColorContext
): string {
  const cleanHex = baseColorHex.trim();
  const hex = cleanHex.startsWith('#') ? cleanHex : `#${cleanHex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return FAMILY_DEFAULTS.neutral;
  }

  const cacheKey = context
    ? `${hex.toUpperCase()}_${context.title || ''}_${context.titleIndex ?? ''}_${context.volumeNumber ?? ''}`
    : hex.toUpperCase();

  const cached = softPaletteCache.get(cacheKey);
  if (cached) return cached;

  const [srcH, , srcL] = hexToHsl(hex);
  const family = getColorFamily(hex);

  let selectedHex: string;

  if (family === 'neutral') {
    if (srcL < 0.28) {
      selectedHex = '#373432'; // Sumi Ink
    } else if (srcL < 0.48) {
      selectedHex = '#55514C'; // Charcoal
    } else if (srcL > 0.80) {
      selectedHex = '#ECE3D0'; // Warm Ivory
    } else if (srcL > 0.65) {
      selectedHex = '#E3D5BD'; // Cream
    } else {
      selectedHex = '#A68C75'; // Taupe
    }
  } else {
    const familySwatches = PRECOMPUTED_SWATCHES.filter((sw) => sw.family === family);
    if (familySwatches.length === 0) {
      selectedHex = FAMILY_DEFAULTS[family] || FAMILY_DEFAULTS.neutral;
    } else {
      const titleHash = hashString(context?.title || '') ^ ((context?.titleIndex ?? 0) * 31);

      // Score swatches in the family by matching source hue, target spine depth (0.38), and priority
      const candidates = [...familySwatches].sort((a, b) => {
        let dHa = Math.abs(srcH - a.h);
        if (dHa > 180) dHa = 360 - dHa;
        let dHb = Math.abs(srcH - b.h);
        if (dHb > 180) dHb = 360 - dHb;

        const scoreA = (dHa / 180) * 30 + Math.abs(a.l - 0.38) * 45 + a.priority * 8;
        const scoreB = (dHb / 180) * 30 + Math.abs(b.l - 0.38) * 45 + b.priority * 8;
        return scoreA - scoreB;
      });

      // When context is provided, alternate among top matching swatches based on titleHash
      const candidateIndex = context
        ? Math.abs(titleHash) % Math.min(candidates.length, 3)
        : 0;
      selectedHex = candidates[candidateIndex]?.hex || candidates[0].hex;
    }
  }

  // Modulate shade per title and per volume so titles sharing the same color family
  // (e.g. multiple blue mangas) get distinct darker/lighter shades:
  if (context?.title || typeof context?.titleIndex === 'number' || typeof context?.volumeNumber === 'number') {
    const titleHash = hashString(context.title || '') ^ ((context.titleIndex ?? 0) * 17);
    // Subtle title lightness shift: -0.04 to +0.04
    const titleLStep = ((Math.abs(titleHash) % 5) - 2) * 0.02;

    // Subtle volume micro-shift between volumes of the same title
    const volLStep =
      typeof context.volumeNumber === 'number' && context.volumeNumber > 0
        ? (((context.volumeNumber * 7) % 5) - 2) * 0.007
        : 0;

    const [h, s, l] = hexToHsl(selectedHex);
    const modulatedL = Math.max(0.18, Math.min(0.65, l + titleLStep + volLStep));
    selectedHex = hslToHex(h, s, modulatedL);
  }

  softPaletteCache.set(cacheKey, selectedHex);
  return selectedHex;
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
  shelfBaseColor?: string,
  volumeNumber?: number
): SpinePalette {
  const rawColor = (shelfBaseColor || book.spineColor)?.trim();
  const hex = rawColor ? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`) : '';
  const hasValidHex = /^#[0-9A-Fa-f]{6}$/.test(hex) && hex.toUpperCase() !== '#8B5A2B';

  const context: SpineColorContext = {
    title: book.title,
    titleIndex,
    volumeNumber,
  };

  let titleColor: string;
  if (hasValidHex) {
    titleColor = mapToSoftPalette(hex, context);
  } else {
    const offset = typeof titleIndex === 'number' ? titleIndex : 0;
    const colorIndex = (14 + offset) % CHROMATIC_SOFT_PALETTE.length;
    const fallbackColor = CHROMATIC_SOFT_PALETTE[colorIndex];
    titleColor = mapToSoftPalette(fallbackColor, context);
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
    typeof book.volumesOwned === 'number' && book.volumesOwned > 0
      ? book.volumesOwned
      : 1
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
