
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// ensure public dir exists
const publicDir = resolve('./public');
if (!existsSync(publicDir)) {
    mkdirSync(publicDir);
}

const sitemapPath = resolve(publicDir, 'sitemap.xml');

// Data for combinations
const years = Array.from({ length: 2013 - 1982 + 1 }, (_, i) => 1982 + i); // 1982-2013 (Charm.li sweet spot)
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

async function generate() {
    const smStream = new SitemapStream({ hostname: 'https://arepnearme.com' });
    const writeStream = createWriteStream(sitemapPath);

    smStream.pipe(writeStream);

    // Home
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });

    // Generate thousands of URLs
    let count = 0;
    for (const make in cars) {
        for (const model of cars[make]) {
            // Clean strings for URL
            const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
            const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

            for (const year of years) {
                for (const task of tasks) { // Tasks are already slugified
                    const url = `/repair/${year}/${makeSlug}/${modelSlug}/${task}`;
                    smStream.write({ url, changefreq: 'monthly', priority: 0.7 });
                    count++;
                }
            }
        }
    }

    smStream.end();
    await streamToPromise(smStream);
    console.log(`Sitemap generated with ${count} URLs at ${sitemapPath}`);
}

generate().catch(console.error);
