import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { Cup } from './Cup'
import { Popcorn } from './Popcorn'
import { CUP } from './dims'
import { BY_ID, SIZES, type FlavourId } from '../data/flavours'
import { INTRO, introClock } from '../lib/clock'
import { clamp01, easeOut, TAU } from '../lib/math'
import { useStore } from '../store'

let keyCounter = 0

/** One cup + its popcorn. Handles its own enter / exit choreography. */
function CupAssembly({
  flavour, intro, leaving, onGone,
}: { flavour: FlavourId; intro: boolean; leaving: boolean; onGone: () => void }) {
  const f = BY_ID[flavour]
  const g = useRef<THREE.Group>(null!)
  const pop = useRef({ v: 0 })

  const getProgress = useCallback(
    () => (intro ? clamp01((introClock.t - INTRO.fall0) / INTRO.fallDur) : pop.current.v),
    [intro],
  )

  // Enter: swings in from the right, spinning and tilted, popcorn blooms after it lands.
  useLayoutEffect(() => {
    if (intro) return
    const grp = g.current
    grp.position.set(5.5, -0.5, 0)
    grp.rotation.set(0, -Math.PI * 1.3, 0.55)
    grp.scale.setScalar(0.55)
    const tl = gsap.timeline()
    tl.to(grp.position, { x: 0, y: 0, duration: 1, ease: 'power3.out' }, 0)
      .to(grp.rotation, { y: 0, z: 0, duration: 1.1, ease: 'power3.out' }, 0)
      .to(grp.scale, { x: 1, y: 1, z: 1, duration: 1, ease: 'back.out(1.4)' }, 0)
      .to(pop.current, { v: 1, duration: 1.1, ease: 'none' }, 0.45)
    return () => { tl.kill() }
  }, [intro])

  // Exit: tips over, spins and slides off to the left.
  useEffect(() => {
    if (!leaving) return
    const grp = g.current
    const tl = gsap.timeline({ onComplete: onGone })
    tl.to(grp.rotation, { y: Math.PI * 1.2, z: -0.7, duration: 0.85, ease: 'power3.in' }, 0)
      .to(grp.position, { x: -5.5, y: -0.6, duration: 0.85, ease: 'power3.in' }, 0)
      .to(grp.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.85, ease: 'power3.in' }, 0)
    return () => { tl.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving])

  return (
    <group ref={g}>
      <Cup colors={f.cup} inner={f.inner} intro={intro} />
      {/* popcorn lives in cup-base space, same offset as the cup */}
      <group position={[0, -CUP.H / 2, 0]}>
        <Popcorn
          tint={f.popcorn.tint}
          roughness={f.popcorn.roughness}
          clearcoat={f.popcorn.clearcoat}
          mode={intro ? 'fall' : 'pop'}
          getProgress={getProgress}
        />
      </group>
    </group>
  )
}

function BlobShadow() {
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    grad.addColorStop(0, 'rgba(0,0,0,0.6)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  useFrame(() => {
    mat.current.opacity = easeOut(clamp01((introClock.t - INTRO.inner) / 0.6))
  })
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -CUP.H / 2 - 0.03, 0]}>
      <planeGeometry args={[3.8, 3.8]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} opacity={0} />
    </mesh>
  )
}

export function CupStage() {
  const flavour = useStore((s) => s.flavour)
  const size = useStore((s) => s.size)
  const orders = useStore((s) => s.orders)
  const stage = useRef<THREE.Group>(null!)
  const [cups, setCups] = useState<{ key: number; id: FlavourId }[]>(() => [{ key: keyCounter++, id: flavour }])

  // New flavour → add the incoming cup; the previous one is flagged as leaving.
  useEffect(() => {
    setCups((cs) => (cs[cs.length - 1].id === flavour ? cs : [...cs, { key: keyCounter++, id: flavour }]))
  }, [flavour])

  // Size scales the whole stage smoothly.
  useFrame((_, dt) => {
    const target = SIZES.find((s) => s.id === size)!.scale
    stage.current.scale.setScalar(THREE.MathUtils.damp(stage.current.scale.x, target, 6, dt))
  })

  // "Order now" gives the cup a celebratory full turn.
  useEffect(() => {
    if (!orders) return
    gsap.to(stage.current.rotation, { y: `+=${TAU}`, duration: 1.1, ease: 'power3.inOut' })
  }, [orders])

  return (
    <group ref={stage}>
      <BlobShadow />
      {cups.map((c, i) => (
        <CupAssembly
          key={c.key}
          flavour={c.id}
          intro={c.key === 0}
          leaving={i < cups.length - 1}
          onGone={() => setCups((cs) => cs.filter((x) => x.key !== c.key))}
        />
      ))}
    </group>
  )
}
