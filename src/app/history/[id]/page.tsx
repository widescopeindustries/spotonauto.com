'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';
import { ArrowLeft, Wrench, AlertTriangle } from 'lucide-react';

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [guide, setGuide] = useState<RepairGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      getGuideById(params.id as string).then((data) => {
        setGuide(data);
        setLoading(false);
      });
    }
  }, [user, params.id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-cyan-400">Loading repair guide...</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Guide not found</h1>
          <p className="text-gray-400 mb-6">This repair guide may have been removed or doesn't exist.</p>
          <button onClick={() => router.push('/history')} className="btn-cyber-primary">
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">{guide.title}</h1>
        <p className="text-gray-400 mb-8">{guide.vehicle}</p>

        {/* Safety Warnings */}
        {guide.safetyWarnings && guide.safetyWarnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-amber-400">Safety Warnings</h2>
            </div>
            <ul className="space-y-2">
              {guide.safetyWarnings.map((warning, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-amber-400 mt-1">-</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tools & Parts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {guide.tools && guide.tools.length > 0 && (
            <div className="glass rounded-xl p-6 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Tools Needed</h2>
              </div>
              <ul className="space-y-1">
                {guide.tools.map((tool, i) => (
                  <li key={i} className="text-gray-300 text-sm">{tool}</li>
                ))}
              </ul>
            </div>
          )}

          {guide.parts && guide.parts.length > 0 && (
            <div className="glass rounded-xl p-6 border border-cyan-500/10">
              <h2 className="text-lg font-bold text-white mb-3">Parts Needed</h2>
              <ul className="space-y-1">
                {guide.parts.map((part, i) => (
                  <li key={i} className="text-gray-300 text-sm">{part}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Steps */}
        {guide.steps && guide.steps.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Repair Steps</h2>
            {guide.steps.map((step, i) => (
              <div key={i} className="glass rounded-xl p-6 border border-cyan-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold text-sm">{step.step || i + 1}</span>
                  </div>
                  <div>
                    <p className="text-gray-200">{step.instruction}</p>
                    {step.imageUrl && (
                      <img src={step.imageUrl} alt={`Step ${step.step || i + 1}`} className="mt-4 rounded-lg max-w-full" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
