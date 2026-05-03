import { Wrench, Mail, Phone, MapPin, Shield, ExternalLink } from 'lucide-react'

const toolLinks = [
  { label: 'AI Diagnostic Chat', href: '#diagnose' },
  { label: 'Factory Manuals', href: '#manual' },
  { label: 'Repair Guides', href: '#manual' },
  { label: 'DTC Code Lookup', href: '#codes' },
  { label: 'Check Engine Light', href: '#diagnose' },
]

const popularLinks = [
  { label: 'Oil Change Guides', href: '#manual' },
  { label: 'Brake Pad Guides', href: '#manual' },
  { label: 'Battery Guides', href: '#manual' },
  { label: 'Spark Plug Guides', href: '#manual' },
  { label: 'Serpentine Belt Guides', href: '#manual' },
  { label: 'All Repair Categories', href: '#manual' },
]

const companyLinks = [
  { label: 'About Us', href: '#' },
  { label: 'Sign In / Sign Up', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Disclaimer', href: '#' },
  { label: 'Contact Us', href: '#' },
]

export default function FooterSection() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                SpotOn<span className="text-[#FF6B00]">Auto</span>
              </span>
            </div>
            <p className="text-sm text-[#6E6E80] mb-4">
              AI-powered auto repair guides. Save $200-500 per repair with step-by-step instructions tailored to your exact vehicle.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">100% Free</span>
              <span className="px-2 py-1 text-xs rounded-full bg-[#5B8DB8]/10 text-[#5B8DB8] border border-[#5B8DB8]/20">No Login Required</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {toolLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors flex items-center gap-1">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Popular Repairs</h4>
            <ul className="space-y-2.5">
              {popularLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors flex items-center gap-1">
                    {link.label}
                    {link.label === 'All Repair Categories' && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-[#6E6E80] hover:text-[#FF6B00] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#6E6E80]">
                <Phone className="w-3.5 h-3.5" />
                <span>682.999.0953</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6E6E80]">
                <Mail className="w-3.5 h-3.5" />
                <span>support@spotonauto.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6E6E80]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Streetman, TX</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-sm text-[#6E6E80]">
                SDVOSB Certified · Veteran-Owned & Operated · Streetman, Texas
              </span>
            </div>
            <p className="text-xs text-[#6E6E80]">
              © 2026 SpotOn Auto. All rights reserved. Powered by AI for the DIY community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}