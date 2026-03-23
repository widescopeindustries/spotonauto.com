'use client';

import { useEffect } from 'react';
import { trackVehicleHubEnter } from '@/lib/analytics';
import { parseVehicleLabel } from '@/lib/analyticsContext';

interface VehicleHubTrackerProps {
  vehicle: string;
}

export default function VehicleHubTracker({ vehicle }: VehicleHubTrackerProps) {
  useEffect(() => {
    trackVehicleHubEnter(vehicle, {
      pageSurface: 'vehicle_hub',
      intentCluster: 'vehicle_hub',
      ...parseVehicleLabel(vehicle),
    });
  }, [vehicle]);

  return null;
}
