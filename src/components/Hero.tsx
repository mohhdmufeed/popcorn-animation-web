export default function Hero() {
  return (
    <section id="hero" className="relative h-screen min-h-[640px] overflow-hidden">
      <header className="hero-fade absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 text-ink md:px-10">
        <span className="font-display text-3xl tracking-wide">REELPOP</span>
        <a
          href="#flavours"
          className="rounded-full border-2 border-ink px-5 py-2 text-sm font-semibold transition hover:bg-ink hover:text-butter focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          See the flavours
        </a>
      </header>

      {/* Sits BELOW the fixed WebGL canvas (z-20), so the cup overlaps the letters. */}
      <h1 className="absolute inset-x-0 top-[12%] z-10 flex flex-col items-center font-display leading-[0.85] tracking-tight text-ink text-[38vw] md:top-[15%] md:flex-row md:justify-between md:px-[3vw] md:text-[21vw]">
        <span className="hero-word">POP</span>
        <span className="hero-word">LOUD</span>
      </h1>

      <p className="hero-fade absolute bottom-8 left-6 z-30 max-w-[17rem] text-sm font-medium leading-snug text-ink md:left-10 md:text-base">
        Cinema-style popcorn, popped to order. Salted, caramel and peri-peri.
      </p>
      <p className="hero-fade absolute bottom-8 right-6 z-30 text-sm font-semibold text-ink md:right-10 md:text-base">
        Scroll to choose
      </p>
    </section>
  )
}
