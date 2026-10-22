import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Topbar } from '../components/Topbar/Topbar'
import { CartDrawer } from '../components/CartDrawer/CartDrawer'
import { Footer } from '../components/Footer/Footer'
import { useLanguage } from '../../i18n/LanguageContext'
import '../styles/customer.css'
import './CustomerLayout.css'

export function CustomerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { language, t } = useLanguage()
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    const targetId = hash ? decodeURIComponent(hash.slice(1)) : ''

    if (!targetId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const startedAt = performance.now()
    let cancelled = false
    const timers = new Set<number>()
    let resizeObserver: ResizeObserver | null = null

    const align = (behavior: ScrollBehavior) => {
      if (cancelled) return

      const target = document.getElementById(targetId)
      if (!target) return

      const offset =
        Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
      const distance = target.getBoundingClientRect().top - offset

      if (Math.abs(distance) > 12) {
        target.scrollIntoView({ behavior, block: 'start' })
      }
    }

    const stop = () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
      resizeObserver?.disconnect()
      resizeObserver = null
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('keydown', stop)
    }

    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        callback()
      }, delay)
      timers.add(timer)
    }

    later(() => align(reduceMotion ? 'auto' : 'smooth'), 50)

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (performance.now() - startedAt > 5000) {
          resizeObserver?.disconnect()
          resizeObserver = null
          return
        }
        align('auto')
      })
      resizeObserver.observe(document.body)
    }

    ;[900, 1800, 3000, 4500].forEach((delay) => {
      later(() => align('auto'), delay)
    })
    later(stop, 5200)

    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('pointerdown', stop)
    window.addEventListener('keydown', stop)

    return stop
  }, [pathname, hash, key])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = t('meta.title')

    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', t('meta.description'))
    }
  }, [language, t])

  return (
    <div className="customer-app">
      <a href="#main-content" className="c-skip-link">
        {t('a11y.skipToContent')}
      </a>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="c-layout__main">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main id="main-content" className="c-layout__content" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>

      <CartDrawer />
    </div>
  )
}