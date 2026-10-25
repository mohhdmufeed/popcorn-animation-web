import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './three/Experience'
import Hero from './components/Hero'
import Flavours from './components/Flavours'
import { pointer, scrollState } from './lib/clock'
import { playIntro } from './lib/intro'
import { useStore } from './store'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const ready = useStore((s) => s.ready)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)

    // 0 → 1 while the flavour section travels from the bottom edge to the top
    const st = ScrollTrigger.create({
      trigger: '#flavours',
      start: 'top bottom',
      end: 'top top',
      onUpdate: (self) => { scrollState.p = self.progress },
    })
    return () => {
      window.removeEventListener('mousemove', onMove)
      st.kill()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    document.fonts.ready.then(playIntro)
  }, [ready])

  return (
    <>
      <Experience />
      <main>
        <Hero />
        <Flavours />
      </main>
    </>
  )
}
