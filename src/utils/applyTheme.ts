function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hN = h / 360, sN = s / 100, lN = l / 100
  if (s === 0) {
    const v = Math.round(lN * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN
  const p = 2 * lN - q
  return [
    Math.round(hue2rgb(p, q, hN + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hN) * 255),
    Math.round(hue2rgb(p, q, hN - 1 / 3) * 255),
  ]
}

// Fixed lightness values for each shade step
const SHADES: [number, number][] = [
  [50, 96], [100, 90], [200, 80], [300, 67],
  [400, 55], [500, 43], [600, 33], [700, 23],
  [800, 15], [900, 9],
]

export function applyArmyTheme(baseHex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(baseHex)) return
  const [h, s] = hexToHsl(baseHex)
  // Cap saturation so very vivid colors still produce readable shades
  const cappedS = Math.min(s, 80)
  for (const [shade, lightness] of SHADES) {
    const [r, g, b] = hslToRgb(h, cappedS, lightness)
    document.documentElement.style.setProperty(`--army-${shade}`, `${r} ${g} ${b}`)
  }
}
