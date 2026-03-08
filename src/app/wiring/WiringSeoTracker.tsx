'use client';

import { useEffect } from 'react';
import { trackWiringSeoView } from '@/lib/analytics';

interface WiringSeoTrackerProps {
  vehicle: string;
  system: string;
}

export default function WiringSeoTracker({ vehicle, system }: WiringSeoTrackerProps) {
  useEffect(() => {
    trackWiringSeoView(vehicle, system);
  }, [vehicle, system]);

  return null;
}

