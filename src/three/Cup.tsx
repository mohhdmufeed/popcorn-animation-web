import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CUP } from './dims'
import { INTRO, introClock } from '../lib/clock'
import { clamp01, easeInOut, easeOut, TAU } from '../lib/math'
import { viewDims } from '../lib/view'

/**
 * The cup is built from 24 vertical strips (12 + 12 alternating colours).
 * Each strip has two states: a flat full-screen bar, and its wedge on the cup.
 * During the intro every vertex is interpolated between the two, so the
 * strips literally fold themselves into the cup.
 */
const N = 24
const ROWS = 10
const COLS = 2
const VERTS = (ROWS + 1) * (COLS + 1)

interface StripeSet {
  geo: THREE.BufferGeometry
  count: number
  cup: Float32Array
  cupN: Float32Array
  meta: Float32Array // [stripeIndex, colFraction, v]
}
interface Flat { cx: number; cy: number; w: number; h: number }

function buildStripes(parity: 0 | 1): StripeSet {
  const stripes: number[] = []
  for (let i = parity; i < N; i += 2) stripes.push(i)
  const count = stripes.length * VERTS
  const cup = new Float32Array(count * 3)
  const cupN = new Float32Array(count * 3)
  const meta = new Float32Array(count * 3)
  const index: number[] = []
  const slope = Math.hypot(CUP.H, CUP.RT - CUP.RB)
  const nr = CUP.H / slope
  const ny = -(CUP.RT - CUP.RB) / slope

  stripes.forEach((si, k) => {
    for (let r = 0; r <= ROWS; r++) {
      const v = r / ROWS
      const radius = CUP.RB + (CUP.RT - CUP.RB) * v
      const y = CUP.H * v
      for (let c = 0; c <= COLS; c++) {
        const cf = c / COLS
        const th = ((si + cf) / N) * TAU
        const o = (k * VERTS + r * (COLS + 1) + c) * 3
        cup[o] = radius * Math.sin(th); cup[o + 1] = y; cup[o + 2] = radius * Math.cos(th)
        cupN[o] = nr * Math.sin(th); cupN[o + 1] = ny; cupN[o + 2] = nr * Math.cos(th)
        meta[o] = si; meta[o + 1] = cf; meta[o + 2] = v
      }
    }
    const base = k * VERTS
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const a = base + r * (COLS + 1) + c
        const b = a + 1
        const c2 = a + COLS + 1
        const d = c2 + 1
        index.push(a, b, c2, b, d, c2)
      }
    }
  })

  const geo = new THREE.BufferGeometry()
  const pos = new THREE.BufferAttribute(cup.slice(), 3)
  const nor = new THREE.BufferAttribute(cupN.slice(), 3)
  pos.setUsage(THREE.DynamicDrawUsage)
  nor.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('position', pos)
  geo.setAttribute('normal', nor)
  geo.setIndex(index)
  return { geo, count, cup, cupN, meta }
}

function morph(set: StripeSet, t: number, flat: Flat) {
  const pos = set.geo.getAttribute('position') as THREE.BufferAttribute
  const nor = set.geo.getAttribute('normal') as THREE.BufferAttribute
  const P = pos.array as Float32Array
  const Nn = nor.array as Float32Array
  const { cup, cupN, meta } = set

  for (let j = 0; j < set.count; j++) {
    const o = j * 3
    const si = meta[o]
    const cf = meta[o + 1]
    const v = meta[o + 2]
    const f = (si + N / 2) % N // left-to-right order on screen

    // 1. strips rise (even from the bottom, odd from the top)
    const rev = easeOut(clamp01((t - INTRO.reveal0 - (f / N) * 0.35) / INTRO.revealDur))
    // 2. edges leave first, centre last
    const delay = (1 - Math.abs(f + 0.5 - N / 2) / (N / 2)) * 0.35
    const e = easeInOut(clamp01((t - INTRO.conv0 - delay) / INTRO.convDur))

    const xf = flat.cx + ((f + cf) / N - 0.5) * flat.w
    const yb = flat.cy - flat.h / 2
    const yt = flat.cy + flat.h / 2
    const yf = f % 2 === 0 ? yb + v * flat.h * rev : yt - (1 - v) * flat.h * rev
    // neighbouring strips weave forwards / backwards on their way in
    const arc = Math.sin(Math.PI * e) * (f % 2 === 0 ? 1.1 : -1.1)

    P[o] = xf + (cup[o] - xf) * e
    P[o + 1] = yf + (cup[o + 1] - yf) * e
    P[o + 2] = cup[o + 2] * e + arc

    // light the flat bars like a poster, roll the normals round as they close
    const nx = cupN[o] * e
    const ny = cupN[o + 1] * e
    const nz = (1 - e) + cupN[o + 2] * e
    const len = Math.hypot(nx, ny, nz) || 1
    Nn[o] = nx / len; Nn[o + 1] = ny / len; Nn[o + 2] = nz / len
  }
  pos.needsUpdate = true
  nor.needsUpdate = true
}

interface CupProps {
  colors: [string, string]
  inner: string
  /** true only for the very first cup (plays the strip intro) */
  intro: boolean
}

export function Cup({ colors, inner, intro }: CupProps) {
  const root = useRef<THREE.Group>(null!)
  const innerGroup = useRef<THREE.Group>(null!)
  const setA = useMemo(() => buildStripes(0), [])
  const setB = useMemo(() => buildStripes(1), [])
  const done = useRef(!intro)
  const size = useThree((s) => s.size)
  const tmpS = useMemo(() => new THREE.Vector3(), [])
  const tmpP = useMemo(() => new THREE.Vector3(), [])

  const innerGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0.03),
      new THREE.Vector2(CUP.RB - CUP.WALL, 0.03),
      new THREE.Vector2(CUP.RT - CUP.WALL, CUP.H),
    ]
    return new THREE.LatheGeometry(pts, 64)
  }, [])

  useLayoutEffect(() => {
    const flat = { cx: 0, cy: 0, w: 1, h: 1 }
    const t = intro ? 0 : 999
    morph(setA, t, flat)
    morph(setB, t, flat)
    innerGroup.current.visible = !intro
    return () => {
      setA.geo.dispose(); setB.geo.dispose(); innerGeo.dispose()
    }
  }, [intro, setA, setB, innerGeo])

  useFrame(() => {
    if (!intro || done.current) return
    const t = introClock.t
    root.current.updateWorldMatrix(true, false)
    root.current.getWorldScale(tmpS)
    root.current.getWorldPosition(tmpP)
    const s = tmpS.x || 1
    const v = viewDims(size.width, size.height)
    // flat bars are sized in screen space, converted into cup-local units
    const flat: Flat = { cx: -tmpP.x / s, cy: -tmpP.y / s, w: (v.w * 1.12) / s, h: (v.h * 1.35) / s }
    morph(setA, t, flat)
    morph(setB, t, flat)

    const k = easeOut(clamp01((t - INTRO.inner) / 0.35))
    innerGroup.current.visible = t >= INTRO.inner
    innerGroup.current.scale.setScalar(0.9 + 0.1 * k)

    if (t >= INTRO.conv0 + INTRO.convDur + 0.4) {
      morph(setA, 999, flat)
      morph(setB, 999, flat)
      innerGroup.current.scale.setScalar(1)
      done.current = true
    }
  })

  return (
    <group ref={root} position={[0, -CUP.H / 2, 0]}>
      <mesh geometry={setA.geo} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial color={colors[0]} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={setB.geo} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial color={colors[1]} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      <group ref={innerGroup}>
        <mesh geometry={innerGeo} receiveShadow castShadow>
          <meshStandardMaterial color={inner} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* rolled paper rim */}
        <mesh position={[0, CUP.H, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[CUP.RT - CUP.WALL * 0.4, 0.05, 14, 72]} />
          <meshStandardMaterial color={colors[1]} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[CUP.RB + 0.005, CUP.RB + 0.005, 0.03, 48]} />
          <meshStandardMaterial color={colors[1]} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
