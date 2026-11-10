// A pill or button tells the 3D layer that its icon is under the pointer.
// A window event keeps the two sides apart: the controls work the same
// whether or not the scene has loaded (or exists at all).

const EVENT = "hub:icon-hover"

export function hoverIcon(id: string | null) {
  window.dispatchEvent(new CustomEvent<string | null>(EVENT, { detail: id }))
}

/** Props that make an element answer for the icon `id`. */
export function iconHover(id: string) {
  return {
    onPointerEnter: () => hoverIcon(id),
    onPointerLeave: () => hoverIcon(null),
  }
}

export function onIconHover(listener: (id: string | null) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<string | null>).detail)
  window.addEventListener(EVENT, handle)
  return () => window.removeEventListener(EVENT, handle)
}
