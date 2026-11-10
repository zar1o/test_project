import { deckArriving } from "./deck"

/**
 * Entrance for page-level blocks: a short rise on first load. When the page
 * arrives through the deck transition the cards are dealt into place instead,
 * so the block renders settled — a rise would also move the surfaces while
 * the deck is measuring where to deal them.
 */
export function enter(delay = 0, y = 12, duration = 0.5) {
  return {
    initial: deckArriving() ? (false as const) : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration, ease: [0.16, 1, 0.3, 1] as const },
  }
}
