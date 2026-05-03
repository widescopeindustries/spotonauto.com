import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, AlertTriangle, Code2, ChevronRight } from 'lucide-react'
import HolographicCard from '@/components/home/HolographicCard'

interface DTCCode {
  code: string
  title: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  cost: string
}

const dtcCodes: DTCCode[] = [
  { code: 'P0010', title: 'Intake Camshaft Position Actuator Circuit (Bank 1)', category: 'Engine', severity: 'medium', cost: '$25 - $120' },
  { code: 'P0011', title: 'Intake Camshaft Position Timing Over-Advanced (Bank 1)', category: 'Engine', severity: 'medium', cost: '$30 - $150' },
  { code: 'P0016', title: 'Crankshaft Position - Camshaft Position Correlation', category: 'Engine', severity: 'high', cost: '$50 - $1,500' },
  { code: 'P0030', title: 'HO2S Heater Control Circuit (Bank 1, Sensor 1)', category: 'Emissions', severity: 'low', cost: '$30 - $100' },
  { code: 'P0101', title: 'Mass Air Flow Sensor Circuit Range/Performance', category: 'Fuel', severity: 'medium', cost: '$40 - $150' },
  { code: 'P0106', title: 'MAP/BARO Sensor Circuit Range/Performance', category: 'Fuel', severity: 'medium', cost: '$20 - $80' },
  { code: 'P0115', title: 'Engine Coolant Temperature Sensor Circuit', category: 'Cooling', severity: 'medium', cost: '$10 - $25' },
  { code: 'P0300', title: 'Random/Multiple Cylinder Misfire Detected', category: 'Ignition', severity: 'high', cost: '$50 - $800' },
  { code: 'P0301', title: 'Cylinder 1 Misfire Detected', category: 'Ignition', severity: 'high', cost: '$50 - $600' },
  { code: 'P0420', title: 'Catalyst System Efficiency Below Threshold', category: 'Emissions', severity: 'medium', cost: '$200 - $1,200' },
  { code: 'P0442', title: 'EVAP System Small Leak Detected', category: 'EVAP', severity: 'low', cost: '$50 - $300' },
  { code: 'P0505', title: 'Idle Control System Malfunction', category: 'Fuel', severity: 'medium', cost: '$100 - $500' },
  { code: 'P0700', title: 'Transmission Control System Malfunction', category: 'Transmission', severity: 'high', cost: '$100 - $2,000' },
  { code: 'P0715', title: 'Input/Turbine Speed Sensor Circuit', category: 'Transmission', severity: 'medium', cost: '$150 - $400' },
  { code: 'P1128', title: 'Upstream Heated O2 Sensors Swapped', category: 'EVAP', severity: 'low', cost: '$50 - $200' },
  { code: 'P1600', title: 'Loss of KAM Power; Open Circuit', category: 'Network', severity: 'low', cost: '$50 - $150' },
  { code: 'P2096', title: 'Post Catalyst Fuel Trim System Too Lean', category: 'Emissions', severity: 'medium', cost: '$100 - $600' },
  { code: 'P2195', title: 'O2 Sensor Signal Stuck Lean', category: 'Fuel', severity: 'medium', cost: '$50 - $300' },
  { code: 'P2509', title: 'ECM/PCM Power Input Signal Intermittent', category: 'Electrical', severity: 'high', cost: '$100 - $400' },
  { code: 'C0035', title: 'Left Front Wheel Speed Circuit Malfunction', category: 'Chassis', severity: 'medium', cost: '$100 - $400' },
  { code: 'B0028', title: 'Right Side Curtain Deployment Control', category: 'Body', severity: 'high', cost: '$200 - $800' },
  { code: 'U0100', title: 'Lost Communication with ECM/PCM', category: 'Network', severity: 'high', cost: '$100 - $500' },
]

const categories = ['All', 'Engine', 'Fuel', 'Ignition', 'Emissions', 'Cooling', 'EVAP', 'Transmission', 'Chassis', 'Electrical', 'Network', 'Body']

const severityColors = {
  low: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
}

export default function DTCCodeSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredCodes = useMemo(() => {
    return dtcCodes.filter((code) => {
      const matchesSearch =
        searchQuery === '' ||
        code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || code.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  return (
    <section id="codes" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5B8DB8]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="w-4 h-4 text-[#5B8DB8]" />
            <span className="text-xs font-medium text-[#5B8DB8] uppercase tracking-wider">OBD2 Trouble Code Lookup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            DTC <span className="text-gradient-steel">Code Library</span>
          </h2>
          <p className="text-[#6E6E80] max-w-xl mx-auto">
            {dtcCodes.length}+ diagnostic trouble codes explained in plain English. Find what your check engine light means, what it costs, and how to fix it.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E80]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codes (e.g. P0420, misfire, catalytic)..."
              className="w-full bg-[#12121A] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-[#6E6E80] focus:outline-none focus:border-[#5B8DB8]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
            />
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-sm rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-[#5B8DB8]/15 border-[#5B8DB8]/40 text-[#5B8DB8]'
                  : 'bg-white/5 border-white/10 text-[#6E6E80] hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCodes.map((code, i) => {
            const sev = severityColors[code.severity]
            return (
              <motion.div
                key={code.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <HolographicCard className="h-full">
                  <div className="p-5 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-lg font-bold text-[#5B8DB8] font-mono">{code.code}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                        {code.severity}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-white mb-2 flex-grow">{code.title}</h3>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6E6E80]">{code.category}</span>
                        <span className="text-xs text-[#6E6E80]">·</span>
                        <span className="text-xs text-[#6E6E80]">{code.cost}</span>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-[#FF6B00] hover:text-[#FF9500] transition-colors group">
                        View
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </HolographicCard>
              </motion.div>
            )
          })}
        </div>

        {filteredCodes.length === 0 && (
          <div className="text-center py-12 text-[#6E6E80]">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No codes found matching your search</p>
          </div>
        )}
      </div>
    </section>
  )
}