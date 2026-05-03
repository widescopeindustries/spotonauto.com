import { motion } from 'framer-motion'
import { BookOpen, Clock, ArrowRight, ShieldAlert, Gauge, Droplets, Battery, Wrench } from 'lucide-react'
import HolographicCard from '@/components/home/HolographicCard'

const repairs = [
  {
    icon: ShieldAlert,
    title: 'P0300 Code: Complete Diagnosis',
    description: 'Random/Multiple Cylinder Misfire - full diagnostic tree with component tests.',
    difficulty: 'High',
    time: '9 min',
    color: '#FF3333',
  },
  {
    icon: Gauge,
    title: 'Ford F-150 Brake Pad Replacement',
    description: 'Step-by-step guide for 2015-2020 models with torque specs.',
    difficulty: 'Medium',
    time: '12 min',
    color: '#FF6B00',
  },
  {
    icon: Droplets,
    title: 'Honda Accord Oil Change',
    description: 'Complete procedure with drain plug location and filter torque.',
    difficulty: 'Easy',
    time: '8 min',
    color: '#5B8DB8',
  },
  {
    icon: Battery,
    title: 'BMW X5 Battery Location & Replacement',
    description: 'Hidden battery access and registration procedure guide.',
    difficulty: 'Medium',
    time: '10 min',
    color: '#FF6B00',
  },
  {
    icon: Wrench,
    title: 'Spark Plug Replacement Guide',
    description: 'Gap settings, torque specs, and anti-seize application.',
    difficulty: 'Easy',
    time: '7 min',
    color: '#5B8DB8',
  },
  {
    icon: ShieldAlert,
    title: 'Check Engine Light Flashing?',
    description: 'Critical warning - stop driving immediately and diagnose.',
    difficulty: 'Critical',
    time: '6 min',
    color: '#FF3333',
  },
]

export default function RepairsSection() {
  return (
    <section id="manual" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-xs font-medium text-[#FF6B00] uppercase tracking-wider">Most Searched Guides</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Popular <span className="text-gradient-orange">Repairs</span>
          </h2>
          <p className="text-[#6E6E80] max-w-xl mx-auto">
            Factory-grounded repair guides with step-by-step instructions, torque specs, and component locations.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {repairs.map((repair, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <HolographicCard className="h-full">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${repair.color}15` }}
                    >
                      <repair.icon className="w-5 h-5" style={{ color: repair.color }} />
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${repair.color}15`,
                        color: repair.color,
                      }}
                    >
                      {repair.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{repair.title}</h3>
                  <p className="text-sm text-[#6E6E80] mb-4 flex-grow">{repair.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-[#6E6E80]">
                      <Clock className="w-3.5 h-3.5" />
                      {repair.time} read
                    </div>
                    <button className="flex items-center gap-1 text-sm text-[#FF6B00] hover:text-[#FF9500] transition-colors group">
                      View Guide
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}