import { create } from 'zustand'
import type { FlavourId, SizeId } from './data/flavours'

interface State {
  flavour: FlavourId
  size: SizeId
  ready: boolean
  introDone: boolean
  busy: boolean
  orders: number
  setReady: () => void
  setIntroDone: () => void
  setSize: (s: SizeId) => void
  setFlavour: (id: FlavourId) => void
  order: () => void
}

export const useStore = create<State>()((set, get) => ({
  flavour: 'salted',
  size: 'medium',
  ready: false,
  introDone: false,
  busy: false,
  orders: 0,
  setReady: () => set({ ready: true }),
  setIntroDone: () => set({ introDone: true }),
  setSize: (size) => set({ size }),
  // Locks briefly so the exit/enter choreography always plays out cleanly.
  setFlavour: (id) => {
    const { busy, flavour } = get()
    if (busy || flavour === id) return
    set({ flavour: id, busy: true })
    window.setTimeout(() => set({ busy: false }), 950)
  },
  order: () => set((s) => ({ orders: s.orders + 1 })),
}))
