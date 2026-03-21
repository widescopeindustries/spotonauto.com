'use client';

import { useEffect } from 'react';
import { trackVehicleHubEnter } from '@/lib/analytics';

interface VehicleHubTrackerProps {
  vehicle: string;
}

export default function VehicleHubTracker({ vehicle }: VehicleHubTrackerProps) {
  useEffect(() => {
    trackVehicleHubEnter(vehicle);
  }, [vehicle]);

  return null;
}
