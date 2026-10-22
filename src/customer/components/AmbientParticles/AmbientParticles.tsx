import { useEffect, useRef } from 'react'
import './AmbientParticles.css'

interface AmbientParticlesProps {
  className?: string
  count?: number
  variant?: 'dark' | 'light'
}

interface Particle {
  x: number
  y: number
  radius: number
  speedX: number
  speedY: number
  alpha: number
  pulse: number
}

export function AmbientParticles({
  className = '',
  count = 28,
  variant = 'dark',
}: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) return

    const parent = canvas.parentElement
    if (!parent) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const color = variant === 'dark' ? '255, 255, 255' : '0, 104, 75'
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frameId = 0
    let inView = true
    let lastTime = 0

    const makeParticles = () => {
      const areaCount = Math.round((width * height) / 22000)
      const total = Math.min(
        52,
        Math.max(10, Math.round(count * 0.55 + areaCount))
      )

      particles = Array.from({ length: total }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.7 + Math.random() * 1.7,
        speedX: (Math.random() - 0.5) * 5,
        speedY: -2 - Math.random() * 5,
        alpha: 0.12 + Math.random() * 0.3,
        pulse: Math.random() * Math.PI * 2,
      }))
    }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      makeParticles()
    }

    const draw = (time: number) => {
      if (!inView || document.hidden) {
        frameId = 0
        return
      }

      const delta = Math.min(32, time - lastTime || 16) / 1000
      lastTime = time
      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.speedX * delta
        particle.y += particle.speedY * delta
        particle.pulse += delta * 0.7

        if (particle.y < -12) {
          particle.y = height + 12
          particle.x = Math.random() * width
        }
        if (particle.y > height + 12) particle.y = -12
        if (particle.x < -12) particle.x = width + 12
        if (particle.x > width + 12) particle.x = -12

        const alpha =
          particle.alpha * (0.72 + Math.sin(particle.pulse) * 0.28)

        context.beginPath()
        context.fillStyle = `rgba(${color}, ${alpha})`
        context.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        )
        context.fill()
      }

      frameId = window.requestAnimationFrame(draw)
    }

    const start = () => {
      if (frameId || !inView || document.hidden) return
      lastTime = 0
      frameId = window.requestAnimationFrame(draw)
    }

    const stop = () => {
      if (!frameId) return
      window.cancelAnimationFrame(frameId)
      frameId = 0
    }

    resize()
    start()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(parent)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView) start()
        else stop()
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(parent)

    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [count, variant])

  return (
    <canvas
      ref={canvasRef}
      className={`c-ambient-particles ${className}`.trim()}
      aria-hidden="true"
    />
  )
}
