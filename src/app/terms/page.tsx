import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-300">
      <h1 className="text-3xl font-display font-bold text-white mb-8">Terms of Service</h1>
      
      <section className="space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-cyan-400">1. Acceptance of Terms</h2>
        <p>
          By accessing or using SpotOnAuto, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">2. Description of Service</h2>
        <p>
          SpotOnAuto provides AI-powered vehicle diagnostics, repair guides, and parts comparisons. The information provided is for informational purposes only and should not replace professional mechanical advice.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">3. User Responsibilities</h2>
        <p>
          You are responsible for ensuring your safety when performing any vehicle repairs. SpotOnAuto is not liable for any damage or injury resulting from the use of our guides. Always consult your vehicle's official service manual.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">4. Modifications to Service</h2>
        <p>
          We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
        </p>
      </section>
    </div>
  );
}
