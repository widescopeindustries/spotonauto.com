import React from 'react';
import SEOHead from '../components/seo/SEOHead';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHead title="Privacy Policy | AI Auto Repair" description="Our commitment to your data privacy." />
      <div className="container mx-auto px-4 py-12 max-w-4xl text-gray-300">
        <h1 className="text-4xl font-bold text-white mb-8 text-glow">Privacy Policy</h1>
        
        <div className="space-y-6 bg-glass-dark p-8 rounded-3xl border border-white/10 shadow-glass">
            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, request a repair guide, or contact us for support. This may include your email address and vehicle information.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">2. How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, including generating personalized repair guides and tracking your repair history.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">3. Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect the security of your personal information.</p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">4. Third-Party Services</h2>
                <p>We may use third-party services (such as Google for authentication and Stripe for payments) which collect and process data according to their own privacy policies.</p>
            </section>

             <section>
                <h2 className="text-2xl font-bold text-brand-cyan mb-4">5. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at support@aiautorepair.com.</p>
            </section>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
