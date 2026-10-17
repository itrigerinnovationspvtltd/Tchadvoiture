import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset window (and marked inner scroll regions) when navigating to a new route. */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) return

    window.scrollTo(0, 0)

    document.querySelectorAll('[data-scroll-root]').forEach((el) => {
      if (el instanceof HTMLElement) el.scrollTop = 0
    })
  }, [pathname, search, hash])

  return null
}
