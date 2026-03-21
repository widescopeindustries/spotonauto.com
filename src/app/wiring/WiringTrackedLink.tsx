'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { trackWiringCtaClick } from '@/lib/analytics';

interface WiringTrackedLinkProps {
  href: string;
  className?: string;
  vehicle: string;
  system: string;
  target:
    | 'interactive_library'
    | 'diagram_jump'
    | 'cluster_nav'
    | 'vehicle_hub'
    | 'repair_path'
    | 'code_path'
    | 'manual_path'
    | 'same_system_vehicle';
  children: ReactNode;
}

export default function WiringTrackedLink({
  href,
  className,
  vehicle,
  system,
  target,
  children,
}: WiringTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackWiringCtaClick(vehicle, system, target)}
    >
      {children}
    </Link>
  );
}
