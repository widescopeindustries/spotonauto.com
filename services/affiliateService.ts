
import { AffiliateLink } from '../types';

const AMAZON_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'aiautorepai04-20';

export const generatePartLinks = (partName: string, vehicleString: string): AffiliateLink[] => {
    let enhancedPartName = partName;
    if (!partName.toLowerCase().includes('kit') && !partName.toLowerCase().includes('assembly')) {
        // enhancedPartName += ' replacement'; 
    }

    const query = `${vehicleString} ${enhancedPartName}`.trim();
    const encodedQuery = encodeURIComponent(query);
    const amazonUrl = `https://www.amazon.com/s?k=${encodedQuery}&tag=${AMAZON_TAG}`;

    // ADDED: Search all parts fallback for better cookie duration/conversion chance
    const searchAllUrl = `https://www.amazon.com/s?k=${encodeURIComponent(vehicleString + ' parts')}&tag=${AMAZON_TAG}`;

    return [
        {
            provider: 'Amazon',
            url: amazonUrl,
            price: 'Shop Request'
        },
        {
            provider: 'Amazon (Search All)',
            url: searchAllUrl,
            price: 'Search All Parts'
        }
    ];
};

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
