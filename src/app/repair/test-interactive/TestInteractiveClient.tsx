'use client';

import InteractiveRepairGuide from '@/components/InteractiveRepairGuide';

const dummyGuide = {
  id: '2015-toyota-camry-fuel-injector-replacement',
  title: 'Fuel Injector Replacement',
  vehicle: '2015 Toyota Camry',
  safetyWarnings: [
    'Relieve fuel pressure before opening any fuel line',
    'Fuel is highly flammable — no sparks or open flame',
    'Allow engine to cool completely before starting',
  ],
  tools: [
    'Socket wrench set',
    'Torque wrench',
    'Fuel line disconnect tool',
    'Digital multimeter',
    'Shop rags',
  ],
  parts: [
    'Fuel injector(s) — match flow rate and impedance',
    'Fuel injector O-rings',
    'Fuel rail gasket',
    'Intake manifold gasket (if disturbed)',
  ],
  steps: [
    { step: 1, instruction: 'Relieve fuel system pressure using the Schrader valve or by removing the fuel pump fuse and running the engine until it stalls.', imagePrompt: '', imageUrl: '' },
    { step: 2, instruction: 'Disconnect the negative battery terminal to prevent sparks near fuel vapors.', imagePrompt: '', imageUrl: '' },
    { step: 3, instruction: 'Remove the engine cover and any intake components blocking access to the fuel rail.', imagePrompt: '', imageUrl: '' },
    { step: 4, instruction: 'Disconnect fuel lines from the rail using a fuel line disconnect tool. Have rags ready to catch residual fuel.', imagePrompt: '', imageUrl: '' },
    { step: 5, instruction: 'Remove the fuel rail mounting bolts and carefully lift the rail with injectors attached.', imagePrompt: '', imageUrl: '' },
    { step: 6, instruction: 'Remove old injectors from the rail and inspect O-ring seats for damage or debris.', imagePrompt: '', imageUrl: '' },
    { step: 7, instruction: 'Lubricate new injector O-rings with clean engine oil and press injectors firmly into the rail.', imagePrompt: '', imageUrl: '' },
    { step: 8, instruction: 'Reinstall the fuel rail, torque bolts to spec (typically 15-18 ft-lbs), reconnect fuel lines and electrical connectors.', imagePrompt: '', imageUrl: '' },
  ],
  sources: [],
  sourceCount: 0,
  retrieval: {
    manualMode: 'none' as const,
    manualSourceCount: 0,
  },
};

export default function TestInteractiveClient() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="border-b border-white/10 bg-black/60 px-4 py-4">
        <h1 className="text-lg font-semibold text-white">Interactive Repair Guide — Test Page</h1>
        <p className="text-sm text-gray-400">2015 Toyota Camry — Fuel Injector Replacement</p>
      </div>
      <InteractiveRepairGuide
        guide={dummyGuide}
        vehicle={{ year: '2015', make: 'toyota', model: 'camry' }}
        onReset={() => window.location.reload()}
        analyticsContext={{
          pageSurface: 'repair_guide',
          task: 'fuel injector replacement',
          taskSlug: 'fuel-injector-replacement',
          vehicleYear: '2015',
          vehicleMake: 'toyota',
          vehicleModel: 'camry',
        }}
      />
    </div>
  );
}
