import { MetadataRoute } from 'next'
import { getSitemapLastMod } from '@/lib/sitemap';

const LAST_MOD = getSitemapLastMod();

/**
 * Manual browser sitemap — landing page + all 82 make pages.
 * Year/model pages are discovered by Google crawling the make pages.
 * The LMDB database covers 1982-2025 and is fixed, so these won't change.
 */

const LMDB_MAKES = [
    'Acura', 'Acura Truck', 'Audi', 'BMW', 'Buick', 'Buick Truck',
    'Cadillac', 'Cadillac Truck', 'Chevrolet', 'Chevy Truck',
    'Chrysler', 'Chrysler Truck', 'Daewoo', 'Daihatsu', 'Daihatsu Truck',
    'Dodge', 'Dodge or Ram Truck', 'Eagle', 'Fiat', 'Ford', 'Ford Truck',
    'Freightliner Truck', 'GMC Truck', 'Geo', 'Geo Truck',
    'Honda', 'Honda Truck', 'Hummer', 'Hyundai', 'Hyundai Truck',
    'Infiniti', 'Infiniti Truck', 'Isuzu', 'Isuzu Truck',
    'Jaguar', 'Jeep Truck', 'Kia', 'Kia Truck', 'Land Rover',
    'Lexus', 'Lexus Truck', 'Lincoln', 'Lincoln Truck',
    'Mazda', 'Mazda Truck', 'Mercedes Benz', 'Mercedes Benz Truck',
    'Mercury', 'Mercury Truck', 'Mini', 'Mitsubishi', 'Mitsubishi Fuso',
    'Mitsubishi Truck', 'Nissan-Datsun', 'Nissan-Datsun Truck',
    'Oldsmobile', 'Oldsmobile Truck', 'Peugeot', 'Plymouth', 'Plymouth Truck',
    'Pontiac', 'Pontiac Truck', 'Porsche', 'Renault', 'SRT', 'Saab',
    'Saturn', 'Saturn Truck', 'Scion', 'Smart', 'Subaru', 'Subaru Truck',
    'Suzuki', 'Suzuki Truck', 'Toyota', 'Toyota Truck', 'UD',
    'Volkswagen', 'Volkswagen Truck', 'Volvo', 'Workhorse', 'Yugo',
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // Landing page
    entries.push({
        url: `${baseUrl}/manual`,
        lastModified: LAST_MOD,
        changeFrequency: 'monthly',
        priority: 0.8,
    });

    // Make pages (e.g., /manual/Toyota, /manual/Honda%20Truck)
    for (const make of LMDB_MAKES) {
        entries.push({
            url: `${baseUrl}/manual/${encodeURIComponent(make)}`,
            lastModified: LAST_MOD,
            changeFrequency: 'monthly',
            priority: 0.7,
        });
    }

    return entries;
}
