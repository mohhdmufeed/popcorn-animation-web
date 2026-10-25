import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BY_ID, FLAVOURS, SIZES, type FlavourId } from '../data/flavours'
import { useStore } from '../store'

gsap.registerPlugin(ScrollTrigger)

let discKey = 0

/** The flavour photo, sitting behind the 3D cup. Swaps with the cup. */
function Disc({ id, first, leaving, onGone }: { id: FlavourId; first: boolean; leaving: boolean; onGone: () => void }) {
  const el = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    if (first) return
    const tween = gsap.fromTo(
      el.current,
      { x: 360, rotate: 80, scale: 0.55, autoAlpha: 0 },
      { x: 0, rotate: 0, scale: 1, autoAlpha: 1, duration: 1.1, delay: 0.25, ease: 'power3.out' },
    )
    return () => { tween.kill() }
  }, [first])

  useEffect(() => {
    if (!leaving) return
    const tween = gsap.to(el.current, {
      x: -360, rotate: -80, scale: 0.55, autoAlpha: 0, duration: 0.8, ease: 'power3.in', onComplete: onGone,
    })
    return () => { tween.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving])

  return (
    <div className="absolute inset-0 grid place-items-center">
      <img
        ref={el}
        src={BY_ID[id].image}
        alt=""
        draggable={false}
        className="-translate-y-[17vh] rounded-full object-cover shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:translate-y-0"
        style={{ width: 'min(56vh, 70vw)', height: 'min(56vh, 70vw)' }}
      />
    </div>
  )
}

function DiscStack() {
  const flavour = useStore((s) => s.flavour)
  const [discs, setDiscs] = useState<{ key: number; id: FlavourId }[]>(() => [{ key: discKey++, id: flavour }])
  useEffect(() => {
    setDiscs((d) => (d[d.length - 1].id === flavour ? d : [...d, { key: discKey++, id: flavour }]))
  }, [flavour])
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {discs.map((d, i) => (
        <Disc
          key={d.key}
          id={d.id}
          first={d.key === 0}
          leaving={i < discs.length - 1}
          onGone={() => setDiscs((x) => x.filter((y) => y.key !== d.key))}
        />
      ))}
    </div>
  )
}

export default function Flavours() {
  const flavour = useStore((s) => s.flavour)
  const size = useStore((s) => s.size)
  const setFlavour = useStore((s) => s.setFlavour)
  const setSize = useStore((s) => s.setSize)
  const order = useStore((s) => s.order)

  const [shown, setShown] = useState<FlavourId>(flavour)
  const section = useRef<HTMLElement>(null)
  const textBlock = useRef<HTMLDivElement>(null)
  const f = BY_ID[shown]
  const sizeLabel = SIZES.find((s) => s.id === size)!.label

  useEffect(() => { FLAVOURS.forEach((x) => { new Image().src = x.image }) }, [])

  // Panel slides in when the section arrives.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.panel-in', { autoAlpha: 0, x: 80 }, {
        autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: section.current, start: 'top 45%', toggleActions: 'play none none reverse' },
      })
      gsap.fromTo('.selector-in', { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: section.current, start: 'top 45%', toggleActions: 'play none none reverse' },
      })
    }, section)
    return () => ctx.revert()
  }, [])

  // Text: old copy lifts away, new copy rises in — in step with the 3D swap.
  useEffect(() => {
    if (flavour === shown) return
    const kids = Array.from(textBlock.current!.children)
    const tween = gsap.to(kids, {
      y: -24, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: 'power2.in', onComplete: () => setShown(flavour),
    })
    return () => { tween.kill() }
  }, [flavour, shown])

  useEffect(() => {
    const kids = Array.from(textBlock.current!.children)
    gsap.fromTo(kids, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' })
  }, [shown])

  // Background glow follows the flavour.
  useEffect(() => {
    gsap.to(section.current, { '--glow': BY_ID[flavour].glow, duration: 0.9, ease: 'power2.inOut' })
  }, [flavour])

  return (
    <section
      id="flavours"
      ref={section}
      className="relative h-screen min-h-[680px] overflow-hidden bg-plum text-cream"
      style={{ '--glow': BY_ID['salted'].glow } as CSSProperties}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, var(--glow) 0%, transparent 58%)' }}
      />
      <DiscStack />

      {/* info panel (right on desktop, bottom on mobile) */}
      <div className="absolute inset-x-5 bottom-6 z-30 md:inset-x-auto md:bottom-auto md:right-[5vw] md:top-1/2 md:w-[min(30rem,38vw)] md:-translate-y-1/2">
        <div className="panel-in">
          <div ref={textBlock}>
            <h2 className="font-display text-6xl leading-none md:text-8xl">{f.name}</h2>
            <p className="mt-4 text-base leading-relaxed md:text-lg">
              {f.line1}
              <br />
              {f.line2}
            </p>
          </div>

          <div role="radiogroup" aria-label="Size" className="mt-6 flex gap-2 md:mt-8">
            {SIZES.map((s) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={size === s.id}
                onClick={() => setSize(s.id)}
                className={`flex-1 rounded-full border-2 px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream ${
                  size === s.id ? 'border-cream bg-cream text-plum' : 'border-cream/35 hover:border-cream'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              order()
              // TODO: connect to your ordering flow / checkout
              console.info('Order', { flavour, size })
            }}
            className="mt-4 w-full rounded-full bg-butter px-8 py-4 font-display text-2xl tracking-wide text-ink transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream md:mt-6 md:py-5"
          >
            Order now
          </button>
          <p className="mt-3 text-sm text-cream/70">{sizeLabel} {BY_ID[flavour].name}</p>
        </div>
      </div>

      {/* flavour chooser */}
      <div className="absolute left-1/2 top-5 z-30 -translate-x-1/2 md:bottom-8 md:top-auto">
        <div className="selector-in flex gap-3 md:gap-5">
          {FLAVOURS.map((x) => {
            const active = x.id === flavour
            return (
              <button
                key={x.id}
                aria-pressed={active}
                onClick={() => setFlavour(x.id)}
                className="group flex flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream"
              >
                <img
                  src={x.image}
                  alt=""
                  className={`h-14 w-14 rounded-full object-cover transition duration-300 md:h-16 md:w-16 ${
                    active ? 'scale-110 ring-4 ring-butter' : 'opacity-60 ring-2 ring-cream/30 group-hover:opacity-100'
                  }`}
                />
                <span className={`text-sm font-semibold ${active ? 'text-cream' : 'text-cream/60'}`}>{x.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
