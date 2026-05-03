import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Wrench, Scan, BookOpen, Code, Home, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const navLinks = [
  { label: 'Home', icon: Home, section: 'home' },
  { label: 'Manual', icon: BookOpen, section: 'manual' },
  { label: 'Diagnose', icon: Scan, section: 'diagnose' },
  { label: 'Codes', icon: Code, section: 'codes' },
  { label: 'My Garage', icon: Wrench, section: 'garage' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const setActiveSection = useAppStore((s) => s.setActiveSection)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (section: string) => {
    setActiveSection(section)
    setMobileOpen(false)
    const element = document.getElementById(section)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#050507]/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#home" onClick={() => scrollToSection('home')} className="flex items-center gap-2 group">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-shadow">
                <Wrench className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl text-white tracking-tight">
                SpotOn<span className="text-[#FF6B00]">Auto</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.section}
                  onClick={() => scrollToSection(link.section)}
                  className="relative px-4 py-2 text-sm text-[#EAEAEA]/70 hover:text-white transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#FF6B00] group-hover:w-3/4 transition-all duration-300" />
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10">
                <Shield className="w-3 h-3 text-[#FF6B00]" />
                <span className="text-xs text-[#FF6B00]">SDVOSB Certified</span>
              </div>
              <button className="glass-button text-white">Sign In</button>
            </div>

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[#050507]/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.section}
                  onClick={() => scrollToSection(link.section)}
                  className="flex items-center gap-3 text-2xl text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <link.icon className="w-6 h-6 text-[#FF6B00]" />
                  {link.label}
                </motion.button>
              ))}
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 mt-4">
                <Shield className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-sm text-[#FF6B00]">SDVOSB Certified</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}