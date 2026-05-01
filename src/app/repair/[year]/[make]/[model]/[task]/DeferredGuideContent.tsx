'use client';

import { useEffect, useState } from 'react';
import type { RepairGuide } from '@/types';
import GuideContent from './GuideContent';

interface DeferredGuideContentProps {
  params: {
    year: string;
    make: string;
    model: string;
    task: string;
  };
  fallbackGuide: RepairGuide;
}

export default function DeferredGuideContent({ params, fallbackGuide }: DeferredGuideContentProps) {
  // For the POC, load the interactive guide immediately without a gate
  return (
    <div id="full-ai-guide">
      <GuideContent params={params} fallbackGuide={fallbackGuide} />
    </div>
  );
}
