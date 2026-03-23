'use client';

import { useEffect } from 'react';
import { trackWiringSeoView } from '@/lib/analytics';
import { deriveIntentCluster, parseVehicleLabel } from '@/lib/analyticsContext';

interface WiringSeoTrackerProps {
  vehicle: string;
  system: string;
}

export default function WiringSeoTracker({ vehicle, system }: WiringSeoTrackerProps) {
  useEffect(() => {
    trackWiringSeoView(vehicle, system, {
      pageSurface: 'wiring',
      systemSlug: system,
      intentCluster: deriveIntentCluster({
        pageSurface: 'wiring',
        system,
        vehicle,
      }),
      ...parseVehicleLabel(vehicle),
    });
  }, [vehicle, system]);

  return null;
}
