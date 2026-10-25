export type FlavourId = 'salted' | 'caramel' | 'peri-peri'
export type SizeId = 'small' | 'medium' | 'large'

/**
 * ⚠️ Point these at the files in YOUR /public folder.
 * "/regular.png" means public/regular.png — change names/extensions to match.
 */
const IMAGES: Record<FlavourId, string> = {
  salted: '/regular.png',
  caramel: '/caramel.png',
  'peri-peri': '/peri-peri.png',
}

export interface Flavour {
  id: FlavourId
  name: string
  line1: string
  line2: string
  image: string
  /** [main stripe, second stripe] */
  cup: [string, string]
  /** inside of the cup */
  inner: string
  popcorn: { tint: string; roughness: number; clearcoat: number }
  /** soft light behind the cup on the plum background */
  glow: string
}

export const FLAVOURS: Flavour[] = [
  {
    id: 'salted',
    name: 'Salted',
    line1: 'Light, crisp and buttery.',
    line2: 'Just enough salt to make the next handful disappear.',
    image: IMAGES.salted,
    cup: ['#d4202a', '#fff4dc'],
    inner: '#f3e2bd',
    popcorn: { tint: '#ffffff', roughness: 0.7, clearcoat: 0 },
    glow: 'rgba(212,32,42,0.55)',
  },
  {
    id: 'caramel',
    name: 'Caramel',
    line1: 'Slow-cooked caramel with a glassy snap.',
    line2: 'Sweet, golden and gone before the trailers end.',
    image: IMAGES.caramel,
    cup: ['#a85a1c', '#ffe9c2'],
    inner: '#7a3f12',
    popcorn: { tint: '#f0a24a', roughness: 0.28, clearcoat: 0.8 },
    glow: 'rgba(224,138,50,0.55)',
  },
  {
    id: 'peri-peri',
    name: 'Peri-Peri',
    line1: 'Smoky chilli heat on every kernel.',
    line2: 'Starts bright, builds slowly, keeps you reaching.',
    image: IMAGES['peri-peri'],
    cup: ['#ff5a1f', '#2a1612'],
    inner: '#5a1d10',
    popcorn: { tint: '#ff7a45', roughness: 0.85, clearcoat: 0 },
    glow: 'rgba(255,90,31,0.55)',
  },
]

export const BY_ID = Object.fromEntries(FLAVOURS.map((f) => [f.id, f])) as Record<FlavourId, Flavour>

export const SIZES: { id: SizeId; label: string; scale: number }[] = [
  { id: 'small', label: 'Small', scale: 0.86 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.14 },
]
