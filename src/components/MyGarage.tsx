'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronRight,
  Activity,
  History,
  Settings
} from 'lucide-react';
import { garageService, GarageVehicle, DiagnosisRecord } from '@/services/garageService';
import Link from 'next/link';

interface MyGarageProps {
  userId: string;
}

export default function MyGarage({ userId }: MyGarageProps) {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [stats, setStats] = useState({
    vehicleCount: 0,
    totalDiagnoses: 0,
    activeIssues: 0,
    resolvedIssues: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    loadGarageData();
  }, [userId]);

  async function loadGarageData() {
    try {
      setLoading(true);
      const [garageVehicles, diagnosisHistory, garageStats] = await Promise.all([
        garageService.getGarage(userId),
        garageService.getDiagnosisHistory(userId),
        garageService.getGarageStats(userId),
      ]);

      setVehicles(garageVehicles);
      setDiagnoses(diagnosisHistory);
      setStats(garageStats);
    } catch (error) {
      console.error('Error loading garage:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveVehicle(vehicleId: string) {
    if (!confirm('Remove this vehicle from your garage?')) return;
    
    try {
      await garageService.removeVehicle(vehicleId);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    } catch (error) {
      console.error('Error removing vehicle:', error);
    }
  }

  async function handleAddVehicle() {
    // Navigate to VIN decoder or manual entry
    window.location.href = '/?addVehicle=true';
  }

  const activeDiagnoses = diagnoses.filter(d => d.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Car className="w-5 h-5" />}
          label="Vehicles"
          value={stats.vehicleCount}
          color="cyan"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5" />}
          label="Active Issues"
          value={stats.activeIssues}
          color="red"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Resolved"
          value={stats.resolvedIssues}
          color="green"
        />
        <StatCard 
          icon={<History className="w-5 h-5" />}
          label="Total Diagnoses"
          value={stats.totalDiagnoses}
          color="purple"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* My Vehicles */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-neon-cyan" />
              My Vehicles
            </h3>
            <button
              onClick={handleAddVehicle}
              className="flex items-center gap-1 text-sm text-neon-cyan hover:text-cyan-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState 
              icon={<Car className="w-12 h-12" />}
              title="No vehicles yet"
              description="Add your first vehicle to start tracking repairs"
              action={
                <button
                  onClick={handleAddVehicle}
                  className="mt-4 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-colors"
                >
                  Add Vehicle
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isSelected={selectedVehicle === vehicle.id}
                  onSelect={() => setSelectedVehicle(vehicle.id)}
                  onRemove={() => handleRemoveVehicle(vehicle.id)}
                />
              ))}
            </div>
          )}

        </div>

        {/* Recent Diagnoses */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-neon-cyan" />
              Recent Diagnoses
            </h3>
            <Link 
              href="/history"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>

          {diagnoses.length === 0 ? (
            <EmptyState 
              icon={<Wrench className="w-12 h-12" />}
              title="No diagnoses yet"
              description="Start an AI diagnosis to see your history here"
              action={
                <Link
                  href="/diagnose"
                  className="mt-4 inline-block px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-colors"
                >
                  Start Diagnosis
                </Link>
              }
            />
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {diagnoses.slice(0, 5).map((diagnosis) => (
                <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Issues Alert */}
      {activeDiagnoses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-400">
                {activeDiagnoses.length} Active Issue{activeDiagnoses.length !== 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                You have unresolved diagnoses. View them to get repair guides and parts.
              </p>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}

// Sub-components

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: 'cyan' | 'red' | 'green' | 'purple';
}) {
  const colors = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1 opacity-80">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function VehicleCard({ 
  vehicle, 
  isSelected, 
  onSelect, 
  onRemove 
}: { 
  vehicle: GarageVehicle; 
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-neon-cyan/10 border-neon-cyan' 
          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">
            {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          </h4>
          {vehicle.nickname && (
            <p className="text-sm text-gray-400">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          )}
          {vehicle.mileage && (
            <p className="text-xs text-gray-500 mt-1">
              {vehicle.mileage.toLocaleString()} miles
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/diagnose?year=${vehicle.year}&make=${vehicle.make}&model=${vehicle.model}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
            title="Start Diagnosis"
          >
            <Wrench className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DiagnosisCard({ diagnosis }: { diagnosis: DiagnosisRecord }) {
  const statusColors = {
    active: 'bg-yellow-500/10 text-yellow-400',
    resolved: 'bg-green-500/10 text-green-400',
    archived: 'bg-gray-500/10 text-gray-400'
  };

  return (
    <Link
      href={`/diagnose?id=${diagnosis.id}`}
      className="block p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {diagnosis.vehicle_year} {diagnosis.vehicle_make} {diagnosis.vehicle_model}
          </p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {diagnosis.problem}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[diagnosis.status]}`}>
            {diagnosis.status}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-600 mb-3">{icon}</div>
      <h4 className="text-gray-300 font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
      {action}
    </div>
  );
}
