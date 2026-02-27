// services/affiliateService.ts

import { AffiliateLink } from '../types';

// CRITICAL: Ensure this matches the ID you add to your Amazon Associates Console
const AMAZON_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'antigravity-20'; 

/**
 * Generates smart affiliate links.
 * Prioritizes direct search results for high-ticket items.
 */
export const generatePartLinks = (partName: string, vehicleString: string): AffiliateLink[] => {
    // 1. Clean up strings for search
    const cleanVehicle = vehicleString.replace(/[^a-zA-Z0-9\s]/g, '');
    const cleanPart = partName.replace(/[^a-zA-Z0-9\s]/g, '');
    
    // 2. High-Ticket Detection Logic
    // If it's a valuable part, we might want to change the search strategy or button text
    const isHighTicket = /alternator|starter|strut|shock|compressor|catalytic|manifold|radiator/i.test(cleanPart);
    
    // 3. Construct the Search Query
    // "2005 Acura TL Alternator" is better than just "Alternator"
    const query = `${cleanVehicle} ${cleanPart} replacement`.trim();
    const encodedQuery = encodeURIComponent(query);

    // 4. Generate the Amazon Link (Search Page Strategy)
    // This is safer than direct product linking for an AI because it ensures the user sees parts that actually fit.
    const amazonUrl = `https://www.amazon.com/s?k=${encodedQuery}&i=automotive&tag=${AMAZON_TAG}`;

    const links: AffiliateLink[] = [
        {
            provider: 'Amazon',
            url: amazonUrl,
            // Psychological trigger: "Check Price" gets more clicks than "Buy Now"
            price: isHighTicket ? 'Check Price & Fitment' : 'View on Amazon' 
        }
    ];

    // Future Expansion: Add RockAuto or AutoZone logic here if you join their networks
    // if (isHighTicket) { links.push({ provider: 'AutoZone', ... }) }

    return links;
};

export const generateToolLinks = (toolName: string): AffiliateLink[] => {
    const query = encodeURIComponent(toolName);
    const amazonUrl = `https://www.amazon.com/s?k=${query}&i=automotive&tag=${AMAZON_TAG}`;

    return [
        {
            provider: 'Amazon',
            url: amazonUrl,
            price: 'Find Tool'
        }
    ];
};