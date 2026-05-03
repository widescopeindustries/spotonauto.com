"use client";
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Zap, AlertTriangle } from 'lucide-react'
import DiagnosticScanner from '@/components/home/DiagnosticScanner'
import TerminalTypewriter from '@/components/home/TerminalTypewriter'
import { useAppStore } from '@/store/useAppStore'

const diagnosticLines = [
  'Initializing AI diagnostic engine...',
  'Loading factory service manual database...',
  'Analyzing 1.4M+ OEM procedures...',
  'Connecting to DTC code library (8,881 codes)...',
  'AI diagnostic system ready.',
  'Describe your vehicle symptom to begin analysis.',
]

const exampleSymptoms = [
  'Check engine light + rough idle',
  'Brake pedal feels soft',
  'Battery light on while driving',
  'Engine overheats in traffic',
]

export default function DiagnosticSection() {
  const router = useRouter()
  const [symptom, setSymptom] = useState('')
  const setIsScanning = useAppStore((s) => s.setIsScanning)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsScanning(true), 1500)
    return () => clearTimeout(timer)
  }, [setIsScanning])

  const navigateToDiagnose = (query: string) => {
    if (!query.trim()) return
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      router.push(`/diagnose?q=${encodeURIComponent(query.trim())}`)
    }, 1500)
  }

  const handleSymptomClick = (text: string) => {
    setSymptom(text)
    navigateToDiagnose(text)
  }

  const handleSubmit = () => {
    navigateToDiagnose(symptom)
  }

  return (
    <section id="diagnose" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#5B8DB8]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#5B8DB8] animate-pulse" />
              <span className="text-xs font-medium text-[#5B8DB8] uppercase tracking-wider">AI Diagnosis Ready</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              AI-Powered{' '}
              <span className="text-gradient-steel">Diagnostics</span>
            </h2>

            <p className="text-[#6E6E80] mb-8 max-w-md">
              Describe your vehicle problem and get factory-grounded AI diagnosis in seconds.
              Our system links symptoms to DTC codes and step-by-step repair guides.
            </p>

            <div className="glass-panel p-6 mb-6">
              <div className="flex items-center gap-2 mb-4 text-sm text-[#6E6E80]">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>Safety: Always consult a certified mechanic if unsure</span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E80]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. Check engine light on, rough idle..."
                  aria-label="Describe your vehicle symptom"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-[#6E6E80] focus:outline-none focus:border-[#5B8DB8]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-[#5B8DB8]/10 border border-[#5B8DB8]/30 rounded-xl text-[#5B8DB8] font-medium hover:bg-[#5B8DB8]/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Start AI Diagnosis
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[#6E6E80]">Example symptoms:</span>
              <div className="flex flex-wrap gap-2">
                {exampleSymptoms.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSymptomClick(s)}
                    className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-[#EAEAEA]/70 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <DiagnosticScanner />
            <TerminalTypewriter
              lines={diagnosticLines}
              typingSpeed={35}
              className="w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
