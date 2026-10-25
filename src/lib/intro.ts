import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { INTRO, introClock } from './clock'
import { useStore } from '../store'

let played = false

/** One master timeline: 3D clock + background + headline + UI all share it. */
export function playIntro() {
  if (played) return
  played = true
  const html = document.documentElement
  const done = () => {
    html.classList.remove('intro')
    ScrollTrigger.refresh()
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    introClock.t = INTRO.end + 1
    gsap.set('#hero', { backgroundColor: '#f6c945' })
    gsap.set('.hero-word, .hero-fade', { autoAlpha: 1 })
    done()
    useStore.getState().setIntroDone()
    return
  }

  const tl = gsap.timeline()
  tl.to(introClock, { t: INTRO.end, duration: INTRO.end, ease: 'none' }, 0)
    // the dark "theatre" lifts to butter as the cup closes
    .to('#hero', { backgroundColor: '#f6c945', duration: 0.7, ease: 'power2.inOut' }, INTRO.conv0 + 0.75)
    .fromTo(
      '.hero-word',
      { yPercent: 35, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12, ease: 'power4.out' },
      INTRO.conv0 + 1.0,
    )
    .to('.hero-fade', { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, INTRO.fall0 + 1.0)
    .call(done, [], INTRO.unlock)
    .call(() => useStore.getState().setIntroDone(), [], INTRO.end)
}
