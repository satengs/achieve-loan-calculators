/** WCAG 2.x contrast helpers for the tech panel (colors blended over white when translucent). */
function parse(color: string): [number, number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const rgb = color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] !== undefined ? Number(rgb[4]) : 1];
  return null;
}

export function isColor(value: string): boolean {
  return parse(value) !== null;
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contrast ratio of `color` (blended over white if translucent) against white. */
export function contrastVsWhite(color: string): number | null {
  const c = parse(color);
  if (!c) return null;
  const [r, g, b, a] = c;
  const blend = (x: number) => x * a + 255 * (1 - a);
  const L = luminance([blend(r), blend(g), blend(b)]);
  return Math.round(((1 + 0.05) / (L + 0.05)) * 100) / 100;
}
