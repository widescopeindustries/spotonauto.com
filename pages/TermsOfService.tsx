import React from 'react';
import SEOHead from '../components/seo/SEOHead';

const TermsOfService: React.FC = () => {
  return (
    <>
      <SEOHead title="Terms of Service | AI Auto Repair" description="Terms and conditions for using our service." />
      <div className="container mx-auto px-4 py-12 max-w-4xl text-gray-300">
        <h1 className="text-4xl font-bold text-white mb-8 text-glow">Terms of Service</h1>
        
        <div className="space-y-6 bg-glass-dark p-8 rounded-3xl border border-white/10 shadow-glass">
            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">1. Acceptance of Terms</h2>
                <p>By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">2. Use of Service</h2>
                <p>The repair guides and diagnostic information provided are for informational purposes only. Always consult a professional mechanic if you are unsure about any repair.</p>
                <p className="mt-2 text-red-400 font-semibold">WE ARE NOT LIABLE FOR ANY DAMAGE TO YOUR VEHICLE OR PERSONAL INJURY RESULTING FROM THE USE OF OUR GUIDES.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">3. Accounts</h2>
                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">4. Intellectual Property</h2>
                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of AI Auto Repair and its licensors.</p>
            </section>

             <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">5. Termination</h2>
                <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            </section>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
