/**
 * Extracts vehicle data from charm.li's LMDB database
 * 
 * PREREQUISITES:
 * - Linux environment
 * - lmdb-pages.sqsh mounted to ./lmdb-pages
 * - Node.js dependencies installed: npm install lmdb
 * 
 * USAGE:
 * 1. mkdir -p ./lmdb-pages
 * 2. sudo mount -o loop -t squashfs ./lmdb-pages.sqsh ./lmdb-pages
 * 3. node scripts/extract-charm-li-lmdb.js
 * 4. sudo umount ./lmdb-pages (when done)
 */

const lmdb = require('lmdb');
const fs = require('fs');
const path = require('path');

const LMDB_PATH = './lmdb-pages';
const OUTPUT_FILE = path.join(__dirname, '../src/data/charmLiDatabase.ts');

// Parse charm.li URL paths to extract year/make/model
// Paths look like: /Ford/1992/Explorer/ or /Honda/2005/Civic/
function parsePath(key) {
    const parts = key.split('/').filter(p => p.length > 0);
    
    // Expected: [make, year, model, ...]
    if (parts.length >= 3) {
        const make = parts[0];
        const year = parseInt(parts[1], 10);
        const model = parts[2];
        
        // Validate year is reasonable (1982-2013 per charm.li)
        if (!isNaN(year) && year >= 1982 && year <= 2013) {
            return { make, year, model, fullPath: key };
        }
    }
    
    return null;
}

async function extractFromLMDB() {
    console.log('🔍 Extracting vehicle data from charm.li LMDB...\n');
    
    // Check if LMDB exists
    if (!fs.existsSync(LMDB_PATH)) {
        console.error(`❌ LMDB not found at ${LMDB_PATH}`);
        console.error('Make sure you have:');
        console.error('  1. Mounted lmdb-pages.sqsh to ./lmdb-pages');
        console.error('  2. Run: sudo mount -o loop -t squashfs ./lmdb-pages.sqsh ./lmdb-pages');
        process.exit(1);
    }
    
    const database = {};
    let totalEntries = 0;
    let vehicleEntries = 0;
    
    try {
        // Open LMDB
        const env = lmdb.open(LMDB_PATH, {
            readOnly: true,
            maxDbs: 1,
        });
        
        // Get all keys
        const db = env.openDB({});
        
        console.log('Scanning database entries...');
        
        for (const { key, value } of db.getRange()) {
            totalEntries++;
            
            const parsed = parsePath(key);
            if (parsed) {
                vehicleEntries++;
                const { make, year, model } = parsed;
                
                // Initialize make
                if (!database[make]) {
                    database[make] = {};
                }
                
                // Initialize model
                if (!database[make][model]) {
                    database[make][model] = {
                        years: [],
                        paths: []
                    };
                }
                
                // Add year if not already present
                if (!database[make][model].years.includes(year)) {
                    database[make][model].years.push(year);
                }
                
                database[make][model].paths.push(key);
            }
            
            // Progress indicator
            if (totalEntries % 10000 === 0) {
                process.stdout.write('.');
            }
        }
        
        env.close();
        
        console.log('\n\n✅ Extraction complete!');
        console.log(`Total entries scanned: ${totalEntries}`);
        console.log(`Vehicle entries found: ${vehicleEntries}`);
        
        // Sort years for each model
        for (const make in database) {
            for (const model in database[make]) {
                database[make][model].years.sort((a, b) => a - b);
            }
        }
        
        // Generate TypeScript file
        generateTypeScriptFile(database);
        
        // Print summary
        printSummary(database);
        
    } catch (err) {
        console.error('\n❌ Extraction failed:', err.message);
        console.error('\nTroubleshooting:');
        console.error('  1. Is lmdb-pages.sqsh mounted?');
        console.error('  2. Do you have permission to read the directory?');
        console.error('  3. Is the lmdb package installed? (npm install lmdb)');
        process.exit(1);
    }
}

function generateTypeScriptFile(database) {
    const makes = Object.keys(database).sort();
    
    let tsContent = `// AUTO-GENERATED from charm.li LMDB database
// Generated: ${new Date().toISOString()}
// Source: lmdb-pages.sqsh (charm.li)
// Do not edit manually - run: node scripts/extract-charm-li-lmdb.js

export interface CharmLiVehicle {
    years: number[];
    paths: string[];
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
            const pathsStr = data.paths.map(p => `"${p}"`).join(', ');
            
            tsContent += `        "${model}": { years: [${yearsStr}], paths: [${pathsStr}] },
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

// Get the charm.li path for a specific vehicle
export function getCharmLiPath(year: number, make: string, model: string): string | null {
    const makeData = CHARM_LI_DATABASE[make];
    if (!makeData) return null;
    
    const modelData = makeData[model];
    if (!modelData || !modelData.years.includes(year)) return null;
    
    // Return first path that contains the year
    return modelData.paths.find(p => p.includes(\`/\${year}/\`)) || modelData.paths[0] || null;
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
    
    // Show sample entries
    console.log('\n📋 Sample Entries:');
    const sampleMakes = makes.slice(0, 3);
    sampleMakes.forEach(make => {
        const models = Object.keys(database[make]).slice(0, 3);
        models.forEach(model => {
            const years = database[make][model].years;
            console.log(`  - ${make} ${model}: ${years[0]}-${years[years.length - 1]} (${years.length} years)`);
        });
    });
}

// Check if lmdb package is installed
try {
    require('lmdb');
} catch (e) {
    console.error('❌ LMDB package not installed.');
    console.error('Run: npm install lmdb');
    process.exit(1);
}

// Run extraction
extractFromLMDB();
