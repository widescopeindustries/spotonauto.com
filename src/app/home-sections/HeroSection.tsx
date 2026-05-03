"use client";
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import ExplodedVehicleScene from '@/components/home/ExplodedVehicleScene'
import { useAppStore } from '@/store/useAppStore'

export default function HeroSection() {
  const isExploded = useAppStore((s) => s.isExploded)
  const setIsExploded = useAppStore((s) => s.setIsExploded)

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <ExplodedVehicleScene />

      <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/30 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
        <div className="max-w-2xl">
          <motion.div
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-xs font-medium text-[#FF6B00]">100% Free - No Login Required</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Future of{' '}
            <span className="text-gradient-orange">Auto Repair</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-[#6E6E80] mb-8 max-w-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Visualize every component. Diagnose with precision. Your interactive 3D service manual and personal garage workspace.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={() => setIsExploded(!isExploded)}
              className="group relative px-8 py-4 bg-[#FF6B00] text-white font-semibold rounded-full overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isExploded ? 'Assemble Vehicle' : 'Explore the Chassis'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => document.getElementById('diagnose')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass-button text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#5B8DB8]" />
              AI Diagnose
            </button>
          </motion.div>

          <motion.div
            className="mt-12 flex items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {[
              { value: '1.4M+', label: 'OEM Procedures' },
              { value: '8,881', label: 'DTC Codes' },
              { value: '304K', label: 'Vehicle Variants' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[#6E6E80]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2" aria-hidden="true">
        <span className="text-xs text-[#6E6E80]">Scroll to explore</span>
        <motion.div
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <motion.div
            className="w-1.5 h-3 bg-[#FF6B00] rounded-full mt-2"
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </motion.div>
      </div>
    </section>
  )
}