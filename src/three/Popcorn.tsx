import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CUP } from './dims'
import { clamp01, easeOutBack, mulberry32, TAU } from '../lib/math'

const COUNT = 150
const G = 22
const BOUNCE = 0.25
const DUR = { fall: 2.1, pop: 1.1 }

/* ---------- kernel geometry: a cluster of lumpy lobes with vertex colours ---------- */
const cache: THREE.BufferGeometry[] = []
function kernelGeometry(variant: number) {
  if (cache[variant]) return cache[variant]
  const rnd = mulberry32(100 + variant * 17)
  const parts: THREE.BufferGeometry[] = []
  const lobes = 5 + Math.floor(rnd() * 3)
  for (let l = 0; l < lobes; l++) {
    let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 2)
    g.deleteAttribute('uv')
    g.deleteAttribute('normal')
    g = mergeVertices(g, 1e-3)
    const rad = 0.075 + rnd() * 0.045
    const c = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(0.05 + rnd() * 0.07)
    const ph = rnd() * 10
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const col = new Float32Array(pos.count * 3)
    const cream = new THREE.Color(1, 0.97, 0.88)
    const warm = new THREE.Color(1, 0.84, 0.46)
    const hull = new THREE.Color(0.62, 0.38, 0.17)
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
      const n = Math.sin(x * 5 + ph) * Math.cos(y * 6 + ph * 1.3) * Math.sin(z * 5 + ph * 0.7)
      const r = rad * (1 + 0.3 * n)
      pos.setXYZ(i, c.x + x * r, c.y + y * r, c.z + z * r)
      tmp.copy(cream).lerp(warm, clamp01(n * 0.5 + 0.5) * 0.7)
      if (n < -0.5) tmp.lerp(hull, clamp01((-0.5 - n) * 3))
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.computeVertexNormals()
    parts.push(g)
  }
  const merged = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  cache[variant] = merged
  return merged
}

/* ---------- where every kernel ends up, and how it gets there ---------- */
interface Kernel {
  rx: number; ry: number; rz: number
  sx: number; sy: number; sz: number
  t0: number; T: number; s: number
  r0: [number, number, number]
  spin: [number, number, number]
  variant: number; slot: number; shade: number
}

function buildPile(): Kernel[] {
  const rnd = mulberry32(11)
  const R = CUP.RT - CUP.WALL - 0.12
  const raw = Array.from({ length: COUNT }, () => {
    const r = Math.sqrt(rnd()) * R
    const a = rnd() * TAU
    const mound = 0.62 * (1 - (r / R) ** 2)
    const depth = rnd() * rnd() * 0.5
    return { r, a, y: CUP.H - 0.08 + mound - depth }
  }).sort((p, q) => p.y - q.y) // lowest kernels fall first
  const slots = [0, 0, 0]
  return raw.map((p, i) => {
    const rx = Math.cos(p.a) * p.r
    const rz = Math.sin(p.a) * p.r
    const sy = CUP.H + 3.6 + rnd() * 1.2
    const variant = i % 3
    return {
      rx, ry: p.y, rz,
      sx: rx * 0.5 + (rnd() - 0.5) * 0.25, sy, sz: rz * 0.5 + (rnd() - 0.5) * 0.25,
      t0: (i / COUNT) * 0.85 + rnd() * 0.12,
      T: Math.sqrt((2 * (sy - p.y)) / G),
      s: 0.85 + rnd() * 0.5,
      r0: [rnd() * TAU, rnd() * TAU, rnd() * TAU],
      spin: [(rnd() - 0.5) * 12, (rnd() - 0.5) * 12, (rnd() - 0.5) * 12],
      variant, slot: slots[variant]++, shade: 0.86 + rnd() * 0.24,
    }
  })
}
const PILE = buildPile()
const PER_VARIANT = COUNT / 3

interface PopcornProps {
  tint: string
  roughness: number
  clearcoat: number
  /** 0 → 1 */
  getProgress: () => number
  /** fall = rain into the cup (intro). pop = kernels bloom in place (flavour switch). */
  mode: 'fall' | 'pop'
}

export function Popcorn({ tint, roughness, clearcoat, getProgress, mode }: PopcornProps) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([null, null, null])
  const settled = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geos = useMemo(() => [0, 1, 2].map(kernelGeometry), [])
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ vertexColors: true, color: tint, roughness, clearcoat, clearcoatRoughness: 0.25 }),
    [tint, roughness, clearcoat],
  )

  const apply = (p: number) => {
    const t = p * DUR[mode]
    for (const k of PILE) {
      let x = k.rx, y = k.ry, z = k.rz, sc = k.s, rem = 0
      if (mode === 'fall') {
        const tt = t - k.t0
        if (tt <= 0) {
          sc = 0; x = k.sx; y = k.sy; z = k.sz
        } else if (tt < k.T) {
          const u = tt / k.T
          x = k.sx + (k.rx - k.sx) * u
          z = k.sz + (k.rz - k.sz) * u
          y = k.sy - 0.5 * G * tt * tt
          rem = k.T - tt
        } else {
          const tb = tt - k.T
          const v0 = BOUNCE * G * k.T
          y = k.ry + Math.max(0, v0 * tb - 0.5 * G * tb * tb)
        }
      } else {
        const u = clamp01((t - k.t0 * 0.55) / 0.5)
        sc = u <= 0 ? 0 : k.s * easeOutBack(u)
        y = k.ry - (1 - u) * 0.25
      }
      dummy.position.set(x, y, z)
      dummy.rotation.set(k.r0[0] + k.spin[0] * rem, k.r0[1] + k.spin[1] * rem, k.r0[2] + k.spin[2] * rem)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      meshes.current[k.variant]?.setMatrixAt(k.slot, dummy.matrix)
    }
    meshes.current.forEach((m) => m && (m.instanceMatrix.needsUpdate = true))
  }

  useLayoutEffect(() => {
    const c = new THREE.Color()
    for (const k of PILE) {
      c.setScalar(k.shade)
      meshes.current[k.variant]?.setColorAt(k.slot, c)
    }
    meshes.current.forEach((m) => m && m.instanceColor && (m.instanceColor.needsUpdate = true))
    settled.current = false
    apply(getProgress())
    return () => material.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material])

  useFrame(() => {
    if (settled.current) return
    const p = getProgress()
    apply(p)
    if (p >= 1) settled.current = true
  })

  return (
    <group>
      {[0, 1, 2].map((v) => (
        <instancedMesh
          key={v}
          ref={(el) => { meshes.current[v] = el }}
          args={[geos[v], material, PER_VARIANT]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
