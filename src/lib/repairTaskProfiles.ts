import type { WiringSystemSlug } from '@/data/wiring-seo-cluster';

export interface RepairTaskProfile {
  wiringSystems: WiringSystemSlug[];
  dtcSystems: string[];
  keywords: string[];
}

const REPAIR_TASK_PROFILES: Partial<Record<string, RepairTaskProfile>> = {
  'alternator-replacement': {
    wiringSystems: ['alternator'],
    dtcSystems: ['Electrical', 'Body/Electrical'],
    keywords: ['alternator', 'charging', 'battery', 'generator', 'voltage regulator'],
  },
  'battery-replacement': {
    wiringSystems: ['alternator', 'starter'],
    dtcSystems: ['Electrical', 'Body/Electrical'],
    keywords: ['battery', 'charging', 'voltage', 'slow cranking', 'low voltage'],
  },
  'starter-replacement': {
    wiringSystems: ['starter'],
    dtcSystems: ['Electrical', 'Engine'],
    keywords: ['starter', 'crank', 'starting', 'no start', 'solenoid'],
  },
  'fuel-pump-replacement': {
    wiringSystems: ['fuel-pump'],
    dtcSystems: ['Fuel'],
    keywords: ['fuel pump', 'fuel pressure', 'fuel rail', 'no start', 'stalling'],
  },
  'spark-plug-replacement': {
    wiringSystems: [],
    dtcSystems: ['Ignition', 'Fuel', 'Engine'],
    keywords: ['spark plug', 'misfire', 'ignition coil', 'coil', 'rough idle'],
  },
  'ignition-coil-replacement': {
    wiringSystems: [],
    dtcSystems: ['Ignition', 'Engine'],
    keywords: ['ignition coil', 'misfire', 'coil', 'rough idle'],
  },
  'oxygen-sensor-replacement': {
    wiringSystems: [],
    dtcSystems: ['Emissions'],
    keywords: ['oxygen sensor', 'o2 sensor', 'heater circuit', 'emissions'],
  },
  'thermostat-replacement': {
    wiringSystems: [],
    dtcSystems: ['Cooling'],
    keywords: ['thermostat', 'coolant temp', 'overheating', 'warm-up'],
  },
  'radiator-replacement': {
    wiringSystems: [],
    dtcSystems: ['Cooling'],
    keywords: ['radiator', 'cooling fan', 'coolant leak', 'overheating'],
  },
  'water-pump-replacement': {
    wiringSystems: [],
    dtcSystems: ['Cooling'],
    keywords: ['water pump', 'coolant leak', 'overheating', 'bearing noise'],
  },
  'transmission-fluid-change': {
    wiringSystems: [],
    dtcSystems: ['Transmission'],
    keywords: ['transmission fluid', 'shifting', 'torque converter', 'slipping'],
  },
  'coolant-flush': {
    wiringSystems: [],
    dtcSystems: ['Cooling'],
    keywords: ['coolant', 'overheating', 'temperature', 'cooling system'],
  },
  'crankshaft-sensor-replacement': {
    wiringSystems: [],
    dtcSystems: ['Engine'],
    keywords: ['crankshaft sensor', 'no start', 'stalling', 'timing'],
  },
  'camshaft-sensor-replacement': {
    wiringSystems: [],
    dtcSystems: ['Engine'],
    keywords: ['camshaft sensor', 'timing', 'hard start', 'stalling'],
  },
};

export function getRepairTaskProfile(task: string): RepairTaskProfile {
  const explicit = REPAIR_TASK_PROFILES[task];
  if (explicit) return explicit;

  const words = task.split('-').filter((word) => word !== 'replacement' && word !== 'change');
  return {
    wiringSystems: [],
    dtcSystems: [],
    keywords: words,
  };
}
