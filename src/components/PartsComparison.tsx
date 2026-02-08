'use client';

import React from 'react';
import type { PartWithLinks, AffiliateLink, AffiliateProvider } from '../types';
import { ShoppingCartIcon, CheckCircleIcon, TruckIcon, TagIcon, MapPinIcon, StarIcon } from './Icons';
import { trackAffiliateClick, trackShopAllClick } from '../lib/analytics';

interface PartsComparisonProps {
    parts: PartWithLinks[];
    vehicle: string;
}

// Retailer brand colors and styling
const RETAILER_STYLES: Record<AffiliateProvider, {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    accent: string;
    gradient: string;
}> = {
    Amazon: {
        bg: 'bg-amber-500',
        bgHover: 'hover:bg-amber-400',
        text: 'text-black',
        border: 'border-amber-500/30',
        accent: 'text-amber-400',
        gradient: 'from-amber-500 to-orange-500'
    }
};

// Badge styling
const BADGE_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Prime': {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        icon: <TruckIcon className="w-3 h-3" />
    },
    'OEM Parts': {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        icon: <StarIcon className="w-3 h-3" />
    },
    'Local Pickup': {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        icon: <MapPinIcon className="w-3 h-3" />
    },
    'Wholesale': {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        icon: <TagIcon className="w-3 h-3" />
    },
    'Best Value': {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300',
        icon: <TagIcon className="w-3 h-3" />
    }
};

// Category icons/colors
const CATEGORY_STYLES: Record<string, { color: string; label: string }> = {
    brake: { color: 'text-red-400', label: 'Brake System' },
    engine: { color: 'text-blue-400', label: 'Engine' },
    electrical: { color: 'text-yellow-400', label: 'Electrical' },
    suspension: { color: 'text-purple-400', label: 'Suspension' },
    fluid: { color: 'text-cyan-400', label: 'Fluids' },
    filter: { color: 'text-green-400', label: 'Filters' },
    other: { color: 'text-gray-400', label: 'Other' }
};

const RetailerButton: React.FC<{ link: AffiliateLink; partName: string; vehicle: string; isHighTicket: boolean }> = ({ link, partName, vehicle, isHighTicket }) => {
    const style = RETAILER_STYLES[link.provider];
    const badgeStyle = link.badge ? BADGE_STYLES[link.badge] : null;

    const handleClick = () => {
        trackAffiliateClick({
            provider: link.provider,
            partName,
            vehicle,
            isHighTicket,
            pageType: 'repair_guide'
        });
    };

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`
                group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
                bg-gradient-to-br ${style.gradient} ${style.bgHover}
                ${style.text} font-bold text-sm
                transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                min-w-[120px] w-full
            `}
        >
            {/* Badge */}
            {badgeStyle && (
                <span className={`absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle.bg} ${badgeStyle.text} border border-white/10`}>
                    {badgeStyle.icon}
                    {link.badge}
                </span>
            )}

            <span className="text-xs opacity-80 uppercase tracking-wider">{link.provider}</span>
            <span className="flex items-center gap-1.5">
                <ShoppingCartIcon className="w-4 h-4" />
                {link.buttonText.replace(link.provider, '').replace(' - ', '').trim() || 'Shop Now'}
            </span>
        </a>
    );
};

const PartCard: React.FC<{ part: PartWithLinks; index: number; vehicle: string }> = ({ part, index, vehicle }) => {
    const categoryStyle = CATEGORY_STYLES[part.category] || CATEGORY_STYLES.other;

    return (
        <div
            className={`
                group relative bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-5
                hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300
                ${part.isHighTicket ? 'ring-1 ring-amber-500/30' : ''}
            `}
        >
            {/* High ticket indicator */}
            {part.isHighTicket && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-black text-black uppercase tracking-wider">
                    High-Value Part
                </div>
            )}

            {/* Part header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${categoryStyle.color}`}>
                            {categoryStyle.label}
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">
                        {part.name}
                    </h3>
                </div>
                <CheckCircleIcon className="w-5 h-5 text-emerald-500/60" />
            </div>

            {/* Retailer buttons grid - Updated to show only available links, usually just Amazon now */}
            <div className="grid grid-cols-1 gap-3">
                {part.links.map((link, idx) => (
                    <RetailerButton key={idx} link={link} partName={part.name} vehicle={vehicle} isHighTicket={part.isHighTicket} />
                ))}
            </div>

            {/* Comparison hint removed since we only have one retailer */}
        </div>
    );
};

const PartsComparison: React.FC<PartsComparisonProps> = ({ parts, vehicle }) => {
    // Separate high-ticket items for emphasis
    const highTicketParts = parts.filter(p => p.isHighTicket);
    const regularParts = parts.filter(p => !p.isHighTicket);

    return (
        <section className="space-y-8">
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <ShoppingCartIcon className="text-brand-cyan w-6 h-6" />
                        Shop Parts
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Find parts on Amazon - click to shop
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                        {parts.length} Parts Needed
                    </span>
                </div>
            </div>

            {/* Retailer Legend - Only Amazon */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-400">Amazon - Fast shipping, Prime eligible</span>
                </div>
            </div>

            {/* High Ticket Parts - Featured */}
            {highTicketParts.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <TagIcon className="w-5 h-5" />
                        Major Components
                    </h3>
                    <div className="grid gap-4">
                        {highTicketParts.map((part, index) => (
                            <PartCard key={index} part={part} index={index} vehicle={vehicle} />
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Parts Grid */}
            {regularParts.length > 0 && (
                <div className="space-y-4">
                    {highTicketParts.length > 0 && (
                        <h3 className="text-lg font-bold text-gray-300 uppercase tracking-wider">
                            Additional Parts
                        </h3>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                        {regularParts.map((part, index) => (
                            <PartCard key={index} part={part} index={highTicketParts.length + index} vehicle={vehicle} />
                        ))}
                    </div>
                </div>
            )}

            {/* Shop All CTA */}
            <div className="flex flex-wrap justify-center gap-4 p-6 bg-gradient-to-r from-brand-cyan/5 via-transparent to-neon-purple/5 rounded-2xl border border-white/5">
                <p className="w-full text-center text-sm text-gray-400 mb-2">
                    Can&apos;t find what you need? Browse full catalogs:
                </p>
                <a
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(vehicle + ' parts')}&i=automotive&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShopAllClick('Amazon', vehicle)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-lg hover:scale-105 transition-transform"
                >
                    <ShoppingCartIcon className="w-4 h-4" />
                    All Parts on Amazon
                </a>
            </div>
        </section>
    );
};

export default PartsComparison;