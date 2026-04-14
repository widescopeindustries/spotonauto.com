'use client';

import { 
  type TopdonProduct, 
  getTopdonRecommendations, 
  getContextFromCode 
} from '@/lib/topdonAffiliate';
import TopdonProductCard from './TopdonProductCard';

interface TopdonDiagnosticInjectedProps {
  lastUserMessage: string;
  lastAiMessage: string;
}

export default function TopdonDiagnosticInjected({ 
  lastUserMessage, 
  lastAiMessage 
}: TopdonDiagnosticInjectedProps) {
  // Determine if we should show a recommendation
  const combinedText = (lastUserMessage + ' ' + lastAiMessage).toLowerCase();
  
  const needsScanner = 
    combinedText.includes('scanner') || 
    combinedText.includes('obd') || 
    combinedText.includes('code') ||
    combinedText.includes('dtc') ||
    combinedText.includes('diagnose') ||
    combinedText.includes('advanced') ||
    combinedText.includes('abs') ||
    combinedText.includes('srs');

  const needsBattery = 
    combinedText.includes('battery') || 
    combinedText.includes('alternator') || 
    combinedText.includes('charging') ||
    combinedText.includes('cranking') ||
    combinedText.includes('starting');

  if (!needsScanner && !needsBattery) return null;

  const context = needsBattery ? 'battery' : (needsScanner ? 'advanced' : 'general');
  const recommendations = getTopdonRecommendations(context);

  return (
    <div className="mt-4 mb-6 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">!</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Pro Diagnostic Recommended</h4>
      </div>
      
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        For accurate results on this vehicle, we recommend using a professional {needsBattery ? 'battery tester' : 'scan tool'}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((product) => (
          <TopdonProductCard 
            key={product.slug} 
            product={product} 
            compact 
            surface="diagnostic-chat-injected"
          />
        ))}
      </div>
      
      <p className="mt-4 text-[10px] text-gray-500 italic text-center">
        Verified compatible with most makes/models. Free shipping on orders over $59.
      </p>
    </div>
  );
}
