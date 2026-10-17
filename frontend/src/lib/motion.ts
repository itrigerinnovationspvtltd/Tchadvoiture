import type { CSSProperties } from 'react'

export const interactiveCardClass = 'interactive-card interactive-card-press'
export const interactiveTileClass = 'interactive-card interactive-tile interactive-card-press transition-all duration-300'
export const btnLiftClass = 'btn-lift'

export function staggerDelay(index: number, stepMs = 80): { style: CSSProperties } {
  return { style: { animationDelay: `${index * stepMs}ms` } }
}
