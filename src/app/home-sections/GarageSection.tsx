"use client";
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Plus, Car, Calendar, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react'
import GarageWorkshopScene from '@/components/home/GarageWorkshopScene'
import HolographicCard from '@/components/home/HolographicCard'
import { useAppStore } from '@/store/useAppStore'

const maintenanceEvents = [
  { date: '2025-01-15', title: 'Oil Change', status: 'completed', mileage: '45,200', cost: '$45' },
  { date: '2025-03-10', title: 'Brake Pad Replacement', status: 'completed', mileage: '48,100', cost: '$180' },
  { date: '2025-05-20', title: 'Tire Rotation', status: 'upcoming', mileage: '51,000', cost: '$35' },
  { date: '2025-07-15', title: 'Air Filter Replacement', status: 'upcoming', mileage: '53,500', cost: '$25' },
  { date: '2025-09-01', title: 'Spark Plug Service', status: 'upcoming', mileage: '55,000', cost: '$120' },
]

const years = Array.from({ length: 48 }, (_, i) => (2027 - i).toString())
const makes = ['Toyota', 'Ford', 'Honda', 'BMW', 'Chevrolet', 'Jeep', 'Nissan', 'Hyundai', 'Kia', 'Subaru']
const models: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Tacoma', 'Tundra', 'Highlander'],
  Ford: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco', 'Ranger'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline'],
  BMW: ['X3', 'X5', '3 Series', '5 Series', 'M3', 'M5'],
  Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Camaro', 'Traverse'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator'],
  Nissan: ['Altima', 'Rogue', 'Sentra', 'Frontier', 'Pathfinder', 'Murano'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Palisade'],
  Kia: ['Sorento', 'Sportage', 'Telluride', 'Optima', 'Forte', 'Soul'],
  Subaru: ['Outback', 'Forester', 'Crosstrek', 'WRX', 'Legacy', 'Ascent'],
}

export default function GarageSection() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const garageVehicles = useAppStore((s) => s.garageVehicles)
  const addGarageVehicle = useAppStore((s) => s.addGarageVehicle)

  const handleAddVehicle = () => {
    if (selectedYear && selectedMake && selectedModel) {
      addGarageVehicle({ year: selectedYear, make: selectedMake, model: selectedModel })
      setSelectedYear('')
      setSelectedMake('')
      setSelectedModel('')
      setShowAddModal(false)
    }
  }

  return (
    <section id="garage" className="relative min-h-screen py-24 md:py-32 overflow-hidden">
      <GarageWorkshopScene />

      <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#050507]/90 to-[#050507] z-10 pointer-events-none" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-xs font-medium text-[#FF6B00] uppercase tracking-wider">Personal Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Your <span className="text-gradient-orange">Garage</span>
          </h2>
          <p className="text-[#6E6E80] max-w-xl mx-auto">
            Track maintenance history, schedule services, and access vehicle-specific repair guides in your personal workshop.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="glass-panel p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#FF6B00]" />
                  My Vehicles
                </h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  aria-label="Add vehicle"
                  className="w-8 h-8 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 flex items-center justify-center hover:bg-[#FF6B00]/40 transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#FF6B00]" />
                </button>
              </div>

              {garageVehicles.length === 0 ? (
                <div className="text-center py-8 text-[#6E6E80]">
                  <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No vehicles added yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 text-sm text-[#FF6B00] hover:text-[#FF9500] transition-colors"
                  >
                    Add your first vehicle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {garageVehicles.map((vehicle, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6B00]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                          <div className="text-xs text-[#6E6E80]">Last service: 45 days ago</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6E6E80]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <HolographicCard>
              <div className="p-6">
                <h4 className="text-sm font-medium text-white mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Total Repairs Logged', value: '12' },
                    { label: 'Money Saved vs Shop', value: '$1,240' },
                    { label: 'Upcoming Services', value: '3' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-[#6E6E80]">{stat.label}</span>
                      <span className="text-sm font-semibold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </HolographicCard>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-[#5B8DB8]" />
                <h3 className="text-lg font-semibold text-white">Maintenance Timeline</h3>
              </div>

              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#FF6B00] via-[#5B8DB8] to-transparent" />

                <div className="space-y-6">
                  {maintenanceEvents.map((event, i) => (
                    <motion.div
                      key={i}
                      className="relative pl-14"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <div className={`absolute left-0 top-1 w-12 flex justify-center`}>
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            event.status === 'completed'
                              ? 'bg-[#5B8DB8] border-[#5B8DB8]'
                              : 'bg-transparent border-[#FF6B00]'
                          }`}
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-white">{event.title}</div>
                            <div className="text-xs text-[#6E6E80]">
                              {event.date} · {event.mileage} miles
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {event.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#5B8DB8]" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#FF6B00]" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                event.status === 'completed' ? 'text-[#5B8DB8]' : 'text-[#FF6B00]'
                              }`}
                            >
                              {event.status === 'completed' ? 'Done' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#6E6E80]">Est. cost: {event.cost}</span>
                          <Link href="/repair" className="text-xs text-[#FF6B00] hover:text-[#FF9500] transition-colors flex items-center gap-1">
                            View Guide
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              className="relative w-full max-w-md glass-panel p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Vehicle</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-[#6E6E80]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6E6E80] mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]/50"
                  >
                    <option value="">Select Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#6E6E80] mb-2">Make</label>
                  <select
                    value={selectedMake}
                    onChange={(e) => {
                      setSelectedMake(e.target.value)
                      setSelectedModel('')
                    }}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]/50"
                  >
                    <option value="">Select Make</option>
                    {makes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#6E6E80] mb-2">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]/50 disabled:opacity-50"
                  >
                    <option value="">Select Model</option>
                    {selectedMake && models[selectedMake]?.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddVehicle}
                  disabled={!selectedYear || !selectedMake || !selectedModel}
                  className="w-full py-3 bg-[#FF6B00] text-white font-medium rounded-xl hover:bg-[#FF9500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  Add to Garage
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
