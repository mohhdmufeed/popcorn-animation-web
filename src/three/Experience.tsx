import { useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { CupStage } from './CupStage'
import { CAMERA, viewDims } from '../lib/view'
import { easeInOut, lerp, TAU } from '../lib/math'
import { pointer, scrollState } from '../lib/clock'
import { useStore } from '../store'

const fit = (v: ReturnType<typeof viewDims>, frac: number) =>
  Math.min((frac * v.w) / 2.24, (v.h * 0.74) / 3.0)

/** Moves the cup between the hero pose and the flavour-section pose as you scroll. */
function Rig({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  const par = useRef({ x: 0, y: 0 })
  const size = useThree((s) => s.size)

  useFrame((state, dt) => {
    const v = viewDims(size.width, size.height)
    scrollState.smooth = THREE.MathUtils.damp(scrollState.smooth, scrollState.p, 5, dt)
    const p = scrollState.smooth
    const e = easeInOut(p)
    const live = useStore.getState().introDone ? 1 : 0

    par.current.x = THREE.MathUtils.damp(par.current.x, pointer.x * live, 3, dt)
    par.current.y = THREE.MathUtils.damp(par.current.y, pointer.y * live, 3, dt)

    const s = lerp(fit(v, v.mobile ? 0.66 : 0.37), fit(v, v.mobile ? 0.52 : 0.3), e)
    const yHero = -v.h * (v.mobile ? 0.12 : 0.07)
    const ySec = v.mobile ? v.h * 0.17 : -v.h * 0.02
    const float = Math.sin(state.clock.elapsedTime * 1.2) * 0.04 * live

    g.current.scale.setScalar(s)
    g.current.position.set(0, lerp(yHero, ySec, e) + float, Math.sin(Math.PI * p) * 0.8)
    g.current.rotation.set(
      lerp(0.08, 0.04, e) - par.current.y * 0.12,
      e * TAU + par.current.x * 0.3,
      Math.sin(Math.PI * p) * -0.35,
    )
  })

  return <group ref={g}>{children}</group>
}

export default function Experience() {
  const setReady = useStore((s) => s.setReady)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: CAMERA.position, fov: CAMERA.fov }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        camera.lookAt(0, 0, 0)
        // wait two frames so the first paint is clean before the intro starts
        requestAnimationFrame(() => requestAnimationFrame(setReady))
      }}
    >
      <hemisphereLight args={['#fff1d6', '#4a1d2e', 0.55]} />
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#ffd9a0" />

      <Environment resolution={256} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2.5} position={[0, 5, 3]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffcf8a" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[5, 2, -2]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
      </Environment>

      <Rig>
        <CupStage />
      </Rig>
    </Canvas>
  )
}
