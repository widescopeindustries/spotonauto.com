'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, Clock3 } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/companyInfo';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Send via mailto fallback (works without backend email service)
      const subject = encodeURIComponent(`SpotOnAuto Contact: ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      
      // Open email client as primary action
      window.location.href = `mailto:${COMPANY_INFO.supportEmail}?subject=${subject}&body=${body}`;
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-white mb-8 text-center">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <p className="text-gray-300">
            Reach a real person for support, safety questions, or guide feedback. Phone support is the fastest path; email is available for follow-up.
          </p>

          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Primary Contact</h2>
            <a
              href={COMPANY_INFO.phoneTel}
              className="mt-3 inline-flex items-center gap-2 text-xl font-extrabold text-cyan-100 hover:text-cyan-50"
            >
              <Phone className="h-5 w-5" />
              {COMPANY_INFO.phoneDisplay}
            </a>
            <p className="mt-2 flex items-center gap-2 text-sm text-cyan-100/90">
              <Clock3 className="h-4 w-4" />
              Business hours: {COMPANY_INFO.businessHours}
            </p>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <Phone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Call</h3>
              <a href={COMPANY_INFO.phoneTel} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                {COMPANY_INFO.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Email (Secondary)</h3>
              <a href={`mailto:${COMPANY_INFO.supportEmail}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                {COMPANY_INFO.supportEmail}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Business Address</h3>
              <p className="text-gray-400">
                {COMPANY_INFO.legalName}
                <br />
                {COMPANY_INFO.streetAddress}
                <br />
                {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass p-8 rounded-2xl border border-cyan-500/20">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#10003;</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Opening Email Client</h3>
              <p className="text-gray-400">
                Your email client should open with the message pre-filled. 
                If it didn&apos;t, please email us directly at{' '}
                <a href={`mailto:${COMPANY_INFO.supportEmail}`} className="text-cyan-400">{COMPANY_INFO.supportEmail}</a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea 
                  id="message" 
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={sending}
                className="w-full btn-cyber py-3 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
