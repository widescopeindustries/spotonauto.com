/**
 * Extract vehicle database from running charm.li server
 * This is easier than reading LMDB directly
 * 
 * Run: node scripts/extract-from-running-server.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CHARM_LI_URL = process.env.CHARM_LI_SERVER_URL || 'http://localhost:8080';
const OUTPUT_FILE = path.join(__dirname, '../src/data/charmLiDatabase.ts');

// Fetch HTML from charm.li
function fetchHtml(urlPath) {
    return new Promise((resolve, reject) => {
        const client = CHARM_LI_URL.startsWith('https') ? https : http;
        const url = new URL(urlPath, CHARM_LI_URL);
        
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Parse directory listing
function parseDirectoryListing(html) {
    const links = [];
    const regex = /<a href="([^"]+)">([^<]+)<\/a>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace('/', '').trim();
        
        if (href.endsWith('/') && text && text !== '..') {
            links.push({ href, text });
        }
    }
    
    return links;
}

async function extractFromServer() {
    console.log('🔍 Extracting vehicle data from charm.li server...');
    console.log(`   Server: ${CHARM_LI_URL}\n`);
    
    const database = {};
    
    try {
        // Test connection
        console.log('Testing connection...');
        await fetchHtml('/');
        console.log('✓ Connected to charm.li server\n');
        
        // Get makes
        console.log('Fetching makes...');
        const rootHtml = await fetchHtml('/');
        const makes = parseDirectoryListing(rootHtml);
        console.log(`Found ${makes.length} makes\n`);
        
        // Process each make
        for (const make of makes) {
            const makeName = make.text;
            process.stdout.write(`${makeName} `);
            
            try {
                const makeHtml = await fetchHtml(make.href);
                const years = parseDirectoryListing(makeHtml);
                
                database[makeName] = {};
                
                for (const yearEntry of years) {
                    const year = yearEntry.text;
                    
                    if (!/^\d{4}$/.test(year)) continue;
                    
                    try {
                        const yearHtml = await fetchHtml(yearEntry.href);
                        const models = parseDirectoryListing(yearHtml);
                        
                        for (const model of models) {
                            const modelName = model.text;
                            
                            if (!database[makeName][modelName]) {
                                database[makeName][modelName] = {
                                    years: [],
                                    path: yearEntry.href
                                };
                            }
                            
                            const yearNum = parseInt(year);
                            if (!database[makeName][modelName].years.includes(yearNum)) {
                                database[makeName][modelName].years.push(yearNum);
                            }
                        }
                    } catch (err) {
                        process.stdout.write('!');
                    }
                }
                
                // Sort years
                for (const modelName in database[makeName]) {
                    database[makeName][modelName].years.sort((a, b) => a - b);
                }
                
                process.stdout.write('✓ ');
                
            } catch (err) {
                process.stdout.write('✗ ');
            }
        }
        
        console.log('\n\n✅ Extraction complete!');
        
        // Generate TypeScript
        generateTypeScriptFile(database);
        printSummary(database);
        
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('\nMake sure charm.li server is running:');
        console.error('  charm-li-start');
        console.error('\nOr set CHARM_LI_SERVER_URL:');
        console.error('  export CHARM_LI_SERVER_URL=http://your-server:8080');
        process.exit(1);
    }
}

function generateTypeScriptFile(database) {
    const makes = Object.keys(database).sort();
    
    let tsContent = `// AUTO-GENERATED from charm.li server
// Generated: ${new Date().toISOString()}
// Source: ${CHARM_LI_URL}
// Do not edit manually - run: node scripts/extract-from-running-server.js

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
    let totalCombos = 0;
    
    for (const make of makes) {
        const models = Object.keys(database[make]);
        totalModels += models.length;
        
        for (const model of models) {
            totalCombos += database[make][model].years.length;
        }
    }
    
    console.log(`Makes: ${makes.length}`);
    console.log(`Models: ${totalModels}`);
    console.log(`Year/Model combinations: ${totalCombos}`);
    
    console.log('\n📋 Available Makes:');
    makes.sort().forEach(make => {
        const modelCount = Object.keys(database[make]).length;
        console.log(`  - ${make}: ${modelCount} models`);
    });
}

extractFromServer();
