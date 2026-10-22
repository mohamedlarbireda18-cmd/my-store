import { useLayoutEffect, type RefObject } from 'react'

export function useScrollReveal(
  containerRef: RefObject<HTMLElement>,
  signature = ''
) {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[data-reveal]')
    )

    if (items.length === 0) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-revealed'))
      container.classList.add('c-reveal-ready')
      return
    }

    container.classList.add('c-reveal-ready')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )

    items.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
      container.classList.remove('c-reveal-ready')
    }
  }, [containerRef, signature])
}
