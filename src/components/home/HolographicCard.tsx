"use client";
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface HolographicCardProps {
  children: React.ReactNode
  className?: string
}

export default function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [sheenX, setSheenX] = useState(-100)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    setRotateY(((x - centerX) / centerX) * 12)
    setRotateX(-((y - centerY) / centerY) * 12)
    setSheenX(((x / rect.width) * 200) - 100)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setSheenX(-100)
  }

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        ref={cardRef}
        className="preserve-3d relative overflow-hidden rounded-2xl bg-[#12121A]/80 border border-white/10 backdrop-blur-sm"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        role="article"
      >
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)`,
            transform: `translateX(${sheenX}%)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        {children}
      </motion.div>
    </div>
  )
}