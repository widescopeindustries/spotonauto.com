
import { AffiliateLink } from '../types';

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || 'aiautorepai04-20';

/**
 * Generates affiliate links for a specific part and vehicle.
 * Implements logic to make the search query as specific as possible to increase conversion.
 */
export const generatePartLinks = (partName: string, vehicleString: string): AffiliateLink[] => {
    // Clean up strings for search query
    // We add "replacement" and "kit" keywords to parts that might be generic
    let enhancedPartName = partName;
    if (!partName.toLowerCase().includes('kit') && !partName.toLowerCase().includes('assembly')) {
        // Just adding "replacement" can help find the right item
        // enhancedPartName += ' replacement';
    }

    const query = `${vehicleString} ${enhancedPartName}`.trim();
    const encodedQuery = encodeURIComponent(query);

    // Using the search URL which is the most reliable for deep-linking to specific parts
    const amazonUrl = `https://www.amazon.com/s?k=${encodedQuery}&tag=${AMAZON_TAG}`;

    return [
        {
            provider: 'Amazon',
            url: amazonUrl,
            price: 'Shop on Amazon'
        }
    ];
};

/**
 * Creates a generic link to a "Mechanic Tool Set" or similar for general tools
 */
export const generateToolLinks = (toolName: string): AffiliateLink[] => {
    const query = encodeURIComponent(toolName);
    const amazonUrl = `https://www.amazon.com/s?k=${query}&tag=${AMAZON_TAG}`;

    return [
        {
            provider: 'Amazon',
            url: amazonUrl,
            price: 'Find Tool'
        }
    ];
};
