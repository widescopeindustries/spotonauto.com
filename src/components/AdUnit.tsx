'use client';

interface AdUnitProps {
  slot: string;
  client?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

/** Legacy AdSense retired for the approved Mediavine handoff. Keep callers stable. */
export default function AdUnit(_props: AdUnitProps) {
  return null;
}
