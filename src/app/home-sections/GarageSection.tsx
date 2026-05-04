"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Lock,
  Mail,
  Plus,
  Wrench,
  X,
} from 'lucide-react';
import GarageWorkshopScene from '@/components/home/GarageWorkshopScene';
import HolographicCard from '@/components/home/HolographicCard';
import AuthProviders from '@/components/AuthProviders';
import { useAuth } from '@/contexts/AuthContext';
import { garageService, type GarageVehicle } from '@/services/garageService';
import {
  getHistory,
  getSavedManualReferences,
  type SavedManualReference,
} from '@/services/storageService';
import type { HistoryItem } from '@/types';
import { slugifyRoutePart } from '@/data/vehicles';

const years = Array.from({ length: 48 }, (_, i) => (2027 - i).toString());
const makes = ['Toyota', 'Ford', 'Honda', 'BMW', 'Chevrolet', 'Jeep', 'Nissan', 'Hyundai', 'Kia', 'Subaru'];
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
};

type GarageActivity =
  | {
      id: string;
      type: 'repair';
      title: string;
      meta: string;
      date: number;
      href: string;
    }
  | {
      id: string;
      type: 'manual';
      title: string;
      meta: string;
      date: number;
      href: string;
    };

function buildRecentActivity(history: HistoryItem[], manuals: SavedManualReference[]): GarageActivity[] {
  return [
    ...history.slice(0, 5).map((item) => ({
      id: `history-${item.id}`,
      type: 'repair' as const,
      title: item.title,
      meta: item.vehicle,
      date: item.timestamp,
      href: `/history/${item.id}`,
    })),
    ...manuals.slice(0, 5).map((item) => ({
      id: `manual-${item.guideId}-${item.uri}`,
      type: 'manual' as const,
      title: item.title,
      meta: item.vehicle,
      date: item.savedAt,
      href: item.uri,
    })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);
}

function GarageGate({ onSubmit, email, setEmail }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  email: string;
  setEmail: (value: string) => void;
}) {
  const benefits = [
    { icon: Car, title: 'Vehicle shelf', copy: 'Keep every car you work on in one place.' },
    { icon: Wrench, title: 'Repair history', copy: 'Reopen generated guides and progress notes.' },
    { icon: BookOpen, title: 'Manual references', copy: 'Save the OEM manual links used by each guide.' },
    { icon: AlertCircle, title: 'Open issues', copy: 'Keep diagnostic threads tied to the right vehicle.' },
  ];

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="glass-panel p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/10">
              <Lock className="h-5 w-5 text-[#FF6B00]" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Save the job before you close the tab</h3>
            <p className="mb-6 text-sm leading-6 text-[#A5A5B8]">
              Give us your email and your garage becomes persistent on this device: vehicles, completed repair guides,
              factory manual links used by each guide, and open diagnostic notes.
            </p>
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="garage-email" className="sr-only">Email address</label>
              <input
                id="garage-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white placeholder:text-[#6E6E80] focus:border-[#FF6B00]/60 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#FF9500]"
              >
                <Mail className="h-4 w-4" />
                Unlock Garage
              </button>
            </form>
            <p className="mt-3 text-xs text-[#6E6E80]">
              Already have a profile?{' '}
              <Link href="/auth?redirect=/history" className="text-[#FF6B00] hover:text-[#FF9500]">
                Sign in to your garage
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <benefit.icon className="mb-3 h-5 w-5 text-[#5B8DB8]" />
                <h4 className="mb-1 text-sm font-semibold text-white">{benefit.title}</h4>
                <p className="text-xs leading-5 text-[#6E6E80]">{benefit.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GarageSectionInner() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [email, setEmail] = useState('');
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [manualReferences, setManualReferences] = useState<SavedManualReference[]>([]);
  const [loadingGarage, setLoadingGarage] = useState(false);
  const { user, loading, signup } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadGarage() {
      if (!user) {
        setVehicles([]);
        setHistory([]);
        setManualReferences([]);
        return;
      }

      setLoadingGarage(true);
      const [garageVehicles, savedHistory, savedManuals] = await Promise.all([
        garageService.getGarage(user.id),
        getHistory(),
        getSavedManualReferences(),
      ]);
      if (!cancelled) {
        setVehicles(garageVehicles);
        setHistory(savedHistory);
        setManualReferences(savedManuals);
        setLoadingGarage(false);
      }
    }

    void loadGarage();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleEmailGate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    await signup(email.trim(), 'garage-access');
  };

  const handleAddVehicle = async () => {
    if (!user || !selectedYear || !selectedMake || !selectedModel) return;
    const vehicle = await garageService.addVehicle(user.id, {
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
    });
    setVehicles((current) => [vehicle, ...current]);
    setSelectedYear('');
    setSelectedMake('');
    setSelectedModel('');
    setShowAddModal(false);
  };

  const recentActivity = buildRecentActivity(history, manualReferences);

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
            <span className="text-xs font-medium text-[#FF6B00] uppercase tracking-wider">Email-Gated Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Your <span className="text-gradient-orange">Garage</span>
          </h2>
          <p className="text-[#6E6E80] max-w-xl mx-auto">
            Save vehicles, repair guides, factory manual references, and diagnostic threads after creating a free email-based profile.
          </p>
        </motion.div>

        {!loading && !user ? (
          <GarageGate onSubmit={handleEmailGate} email={email} setEmail={setEmail} />
        ) : (
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

                {loadingGarage ? (
                  <div className="py-8 text-center text-sm text-[#6E6E80]">Loading garage...</div>
                ) : vehicles.length === 0 ? (
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
                    {vehicles.map((vehicle) => (
                      <Link
                        key={vehicle.id}
                        href={`/repair/${vehicle.year}/${slugifyRoutePart(vehicle.make)}/${slugifyRoutePart(vehicle.model)}`}
                        className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6B00]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                            <div className="text-xs text-[#6E6E80]">Saved to your garage</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#6E6E80]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <HolographicCard>
                <div className="p-6">
                  <h4 className="text-sm font-medium text-white mb-4">Saved Value</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Saved Vehicles', value: String(vehicles.length) },
                      { label: 'Repair Guides Saved', value: String(history.length) },
                      { label: 'Manual References', value: String(manualReferences.length) },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className="text-sm text-[#6E6E80]">{stat.label}</span>
                        <span className="text-sm font-semibold text-white">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/history" className="mt-5 inline-flex text-xs font-semibold text-[#FF6B00] hover:text-[#FF9500]">
                    Open full garage
                  </Link>
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
                  <h3 className="text-lg font-semibold text-white">Saved Workbench</h3>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#FF6B00] via-[#5B8DB8] to-transparent" />

                  <div className="space-y-6">
                    {recentActivity.length === 0 && (
                      <div className="pl-14 text-sm text-[#6E6E80]">
                        Saved repair guides and manual references will appear here after you open a repair guide.
                      </div>
                    )}
                    {recentActivity.map((event, i) => (
                      <motion.div
                        key={event.id}
                        className="relative pl-14"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      >
                        <div className="absolute left-0 top-1 w-12 flex justify-center">
                          <div className="w-3 h-3 rounded-full border-2 bg-[#5B8DB8] border-[#5B8DB8]" />
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-white">{event.title}</div>
                              <div className="text-xs text-[#6E6E80]">
                                {event.meta} · {new Date(event.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {event.type === 'manual' ? (
                                <BookOpen className="w-4 h-4 text-[#5B8DB8]" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-[#5B8DB8]" />
                              )}
                              <span className="text-xs font-medium text-[#5B8DB8]">
                                {event.type === 'manual' ? 'Manual' : 'Saved'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6E6E80]">
                              {event.type === 'manual' ? 'Factory manual reference' : 'Repair history'}
                            </span>
                            <Link href={event.href} className="text-xs text-[#FF6B00] hover:text-[#FF9500] transition-colors flex items-center gap-1">
                              Open
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
        )}
      </div>

      <AnimatePresence>
        {showAddModal && user && (
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
                      setSelectedMake(e.target.value);
                      setSelectedModel('');
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
  );
}

export default function GarageSection() {
  return (
    <AuthProviders>
      <GarageSectionInner />
    </AuthProviders>
  );
}
