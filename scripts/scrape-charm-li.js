/**
 * Scraper for charm.li to build a whitelist of available year/make/model combinations
 * Run: node scripts/scrape-charm-li.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CHARM_LI_BASE = 'charm.li';
const OUTPUT_FILE = path.join(__dirname, '../src/data/charmLiDatabase.ts');

// Helper to make HTTPS request
function fetchHtml(urlPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CHARM_LI_BASE,
            path: urlPath,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        req.end();
    });
}

// Parse directory listing from charm.li HTML
function parseDirectoryListing(html) {
    const links = [];
    // Look for links like: <a href="/Ford/">Ford/</a>
    const regex = /<a href="([^"]+)">([^<]+)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace('/', '').trim();
        // Only include directory links (end with /)
        if (href.endsWith('/') && !href.startsWith('http') && text && text !== '..') {
            links.push({ href, text });
        }
    }
    return links;
}

async function scrapeCharmLi() {
    console.log('🔍 Scraping charm.li structure...\n');
    
    const database = {};
    
    try {
        // Step 1: Get all makes
        console.log('Step 1: Fetching makes...');
        const rootHtml = await fetchHtml('/');
        const makes = parseDirectoryListing(rootHtml);
        console.log(`Found ${makes.length} makes: ${makes.map(m => m.text).join(', ')}\n`);
        
        // Step 2: For each make, get years
        for (const make of makes) {
            const makeName = make.text;
            console.log(`\n📁 Processing ${makeName}...`);
            
            try {
                const makeHtml = await fetchHtml(make.href);
                const years = parseDirectoryListing(makeHtml);
                
                database[makeName] = {};
                
                // Step 3: For each year, get models
                for (const yearEntry of years) {
                    const year = yearEntry.text;
                    
                    // Validate year is a 4-digit number
                    if (!/^\d{4}$/.test(year)) continue;
                    
                    try {
                        const yearHtml = await fetchHtml(yearEntry.href);
                        const models = parseDirectoryListing(yearHtml);
                        
                        for (const model of models) {
                            const modelName = model.text;
                            
                            if (!database[makeName][modelName]) {
                                database[makeName][modelName] = {
                                    years: [],
                                    path: make.href + year + '/'
                                };
                            }
                            database[makeName][modelName].years.push(parseInt(year));
                        }
                        
                        process.stdout.write('.');
                    } catch (err) {
                        console.warn(`\n  ⚠️  Error fetching ${yearEntry.href}: ${err.message}`);
                    }
                }
                
                // Sort years for each model
                for (const modelName in database[makeName]) {
                    database[makeName][modelName].years.sort((a, b) => a - b);
                }
                
            } catch (err) {
                console.warn(`\n  ⚠️  Error processing ${makeName}: ${err.message}`);
            }
        }
        
        console.log('\n\n✅ Scraping complete!');
        
        // Generate TypeScript file
        generateTypeScriptFile(database);
        
        // Print summary
        printSummary(database);
        
    } catch (err) {
        console.error('❌ Scraping failed:', err.message);
        process.exit(1);
    }
}

function generateTypeScriptFile(database) {
    const makes = Object.keys(database).sort();
    
    let tsContent = `// AUTO-GENERATED from charm.li scrape
// Do not edit manually - run: node scripts/scrape-charm-li.js

export interface CharmLiVehicle {
    years: number[];
    path: string;
}

export const CHARM_LI_DATABASE: Record<string, Record<string, CharmLiVehicle>> = {
`;

    for (const make of makes) {
        tsContent += `    "${make}": {
`;
        const models = Object.keys(database[make]).sort();
        
        for (const model of models) {
            const data = database[make][model];
            const yearsStr = data.years.join(', ');
            tsContent += `        "${model}": { years: [${yearsStr}], path: "${data.path}" },
`;
        }
        
        tsContent += `    },
`;
    }

    tsContent += `};

// Helper to check if a specific year/make/model exists in charm.li
export function isInCharmLi(year: number, make: string, model: string): boolean {
    const makeData = CHARM_LI_DATABASE[make];
    if (!makeData) return false;
    
    const modelData = makeData[model];
    if (!modelData) return false;
    
    return modelData.years.includes(year);
}

// Get all available makes
export function getCharmLiMakes(): string[] {
    return Object.keys(CHARM_LI_DATABASE).sort();
}

// Get all models for a make
export function getCharmLiModels(make: string): string[] {
    const makeData = CHARM_LI_DATABASE[make];
    return makeData ? Object.keys(makeData).sort() : [];
}

// Get all years for a specific make/model
export function getCharmLiYears(make: string, model: string): number[] {
    const makeData = CHARM_LI_DATABASE[make];
    if (!makeData) return [];
    
    const modelData = makeData[model];
    return modelData ? modelData.years : [];
}
`;

    fs.writeFileSync(OUTPUT_FILE, tsContent);
    console.log(`\n💾 Database saved to: ${OUTPUT_FILE}`);
}

function printSummary(database) {
    console.log('\n📊 Summary:');
    console.log('===========');
    
    const makes = Object.keys(database);
    let totalModels = 0;
    let totalYearModelCombos = 0;
    
    for (const make of makes) {
        const models = Object.keys(database[make]);
        totalModels += models.length;
        
        for (const model of models) {
            totalYearModelCombos += database[make][model].years.length;
        }
    }
    
    console.log(`Makes: ${makes.length}`);
    console.log(`Models: ${totalModels}`);
    console.log(`Year/Model combinations: ${totalYearModelCombos}`);
    
    console.log('\n📋 Available Makes:');
    makes.sort().forEach(make => {
        const modelCount = Object.keys(database[make]).length;
        console.log(`  - ${make}: ${modelCount} models`);
    });
}

// Run the scraper
scrapeCharmLi();
