'use client';

import type { RepairGuide } from '@/types';
import RepairGuideDisplay from './RepairGuideDisplay';

interface InteractiveRepairGuideProps {
  guide: RepairGuide;
  vehicle: { year: string; make: string; model: string };
  onReset: () => void;
  analyticsContext?: Record<string, unknown>;
}

export function InteractiveRepairGuide({
  guide,
  onReset,
}: InteractiveRepairGuideProps) {
  // Render the full AI-powered repair guide with parts/tools affiliate blocks.
  // Previously this was stubbed out (returned null), which broke the "Open full guide" CTA.
  return <RepairGuideDisplay guide={guide} onReset={onReset} />;
}
