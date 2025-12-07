
export interface AffiliateLink {
    provider: 'Amazon' | 'AutoZone' | 'RockAuto';
    url: string;
    price?: string; // Optional if we ever get into scraping prices
}

const AMAZON_TAG = 'aiautorepair-20'; // Placeholder tag

export const generatePartLinks = (partName: string, vehicleStr: string): AffiliateLink[] => {
    const query = `${partName} for ${vehicleStr}`;
    const encodedQuery = encodeURIComponent(query);

    return [
        {
            provider: 'Amazon',
            url: `https://www.amazon.com/s?k=${encodedQuery}&tag=${AMAZON_TAG}`,
        },
        // Future: Add AutoZone or others here. 
        // AutoZone search structure: https://www.autozone.com/search?searchText=brake+pads
    ];
};
