import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-300">
      <h1 className="text-3xl font-display font-bold text-white mb-8">Privacy Policy</h1>
      
      <section className="space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-cyan-400">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when using SpotOnAuto, including vehicle details (VIN, make, model) and diagnostic data from your OBD-II scanner. If you create an account ("My Garage"), we store your scan history securely.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">2. How We Use Information</h2>
        <p>
          We use your vehicle data solely to provide accurate diagnostic insights, generate repair guides, and find compatible parts. We do not sell your personal data to third parties.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">3. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
        </p>

        <h2 className="text-xl font-bold text-cyan-400">4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at support@spotonauto.com.
        </p>
      </section>
    </div>
  );
}
