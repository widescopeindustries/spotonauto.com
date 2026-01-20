import { MetadataRoute } from 'next'

const years = Array.from({ length: 2013 - 1982 + 1 }, (_, i) => 1982 + i);
const cars = {
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', 'Sienna'],
    Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit'],
    Ford: ['F-150', 'Escape', 'Explorer', 'Focus', 'Fusion', 'Mustang', 'Edge'],
    Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban', 'Impala'],
    Nissan: ['Altima', 'Rogue', 'Sentra', 'Versa', 'Pathfinder'],
    Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
    Kia: ['Optima', 'Sorento', 'Soul', 'Sportage'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5'],
    Mercedes: ['C-Class', 'E-Class', 'GLC', 'GLE'],
    Jeep: ['Grand Cherokee', 'Wrangler', 'Cherokee'],
    Subaru: ['Outback', 'Forester', 'Crosstrek']
};

const tasks = [
    'oil-change',
    'brake-pad-replacement',
    'brake-rotor-replacement',
    'alternator-replacement',
    'starter-replacement',
    'battery-replacement',
    'spark-plug-replacement',
    'radiator-replacement',
    'thermostat-replacement',
    'water-pump-replacement',
    'serpentine-belt-replacement',
    'cabin-air-filter-replacement',
    'engine-air-filter-replacement',
    'headlight-bulb-replacement'
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ];

    // Note: Next.js might have limits on sitemap size if generated dynamically like this.
    // For 25k URLs, this is fine.
    for (const [make, models] of Object.entries(cars)) {
        const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
        for (const model of models) {
            const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
            for (const year of years) {
                for (const task of tasks) {
                    entries.push({
                        url: `${baseUrl}/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
                        lastModified: new Date(),
                        changeFrequency: 'monthly',
                        priority: 0.7,
                    });
                }
            }
        }
    }

    return entries;
}
