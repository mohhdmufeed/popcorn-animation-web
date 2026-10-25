export const CAMERA = {
  position: [0, 0, 7] as [number, number, number],
  fov: 38,
}

export function viewDims(width: number, height: number) {
  const aspect = width / height
  const fovRad = (CAMERA.fov * Math.PI) / 180
  const dist = CAMERA.position[2]
  const h = 2 * Math.tan(fovRad / 2) * dist
  const w = h * aspect
  const mobile = width < 768
  return { w, h, mobile, aspect }
}
