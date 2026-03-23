'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { trackRepairAnswerClick } from '@/lib/analytics';

interface RepairTrackedLinkProps {
  href: string;
  className?: string;
  vehicle: string;
  task: string;
  section: string;
  target: string;
  label: string;
  children: ReactNode;
}

export default function RepairTrackedLink({
  href,
  className,
  vehicle,
  task,
  section,
  target,
  label,
  children,
}: RepairTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackRepairAnswerClick({
        vehicle,
        task,
        section,
        target,
        label,
        href,
      })}
    >
      {children}
    </Link>
  );
}
