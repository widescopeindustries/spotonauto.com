/**
 * Script to validate existing repair pages against the vehicle database
 * Run this to identify pages that should be removed (404'd)
 * 
 * Usage: node scripts/validate-existing-pages.js
 */

const { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } = require('../src/data/vehicles.ts');

// Example: List of URLs that were generated (you would fetch this from your database or crawl your site)
// For now, this shows the validation logic

function validateUrl(year, make, model, task) {
    const yearNum = parseInt(year, 10);
    
    // Check make
    const makeEntry = Object.entries(VEHICLE_PRODUCTION_YEARS).find(
        ([m]) => m.toLowerCase() === make.toLowerCase()
    );
    
    if (!makeEntry) {
        return { valid: false, reason: `Unknown make: ${make}` };
    }
    
    const [, models] = makeEntry;
    
    // Check model
    const modelEntry = Object.entries(models).find(([m]) => {
        const normalizedDbModel = m.toLowerCase().replace(/\s+/g, '-');
        const normalizedInputModel = model.toLowerCase().replace(/\s+/g, '-');
        return normalizedDbModel === normalizedInputModel;
    });
    
    if (!modelEntry) {
        return { valid: false, reason: `Unknown model: ${make} ${model}` };
    }
    
    const [, productionYears] = modelEntry;
    
    // Check year
    if (yearNum < productionYears.start || yearNum > productionYears.end) {
        return { 
            valid: false, 
            reason: `Invalid year: ${yearNum} ${make} ${model} (valid: ${productionYears.start}-${productionYears.end})` 
        };
    }
    
    // Check task
    if (!VALID_TASKS.includes(task)) {
        return { valid: false, reason: `Unknown task: ${task}` };
    }
    
    return { valid: true };
}

// Test cases for the problematic URLs from the audit
const testUrls = [
    { year: '1985', make: 'ford', model: 'explorer', task: 'radiator-replacement' },
    { year: '1993', make: 'ford', model: 'escape', task: 'alternator-replacement' },
    { year: '1991', make: 'ford', model: 'fusion', task: 'starter-replacement' },
    { year: '1994', make: 'toyota', model: 'prius', task: 'radiator-replacement' },
    { year: '1997', make: 'subaru', model: 'crosstrek', task: 'brake-pad-replacement' },
    { year: '1991', make: 'bmw', model: 'x5', task: 'brake-rotor-replacement' },
    { year: '1985', make: 'kia', model: 'soul', task: 'brake-rotor-replacement' },
    { year: '1991', make: 'mercedes', model: 'glc', task: 'spark-plug-replacement' },
    // Valid ones
    { year: '1992', make: 'ford', model: 'explorer', task: 'radiator-replacement' },
    { year: '2005', make: 'ford', model: 'escape', task: 'alternator-replacement' },
    { year: '2008', make: 'ford', model: 'fusion', task: 'starter-replacement' },
];

console.log('=== Validating Test URLs ===\n');

let validCount = 0;
let invalidCount = 0;

for (const url of testUrls) {
    const result = validateUrl(url.year, url.make, url.model, url.task);
    const status = result.valid ? '✅ VALID' : '❌ INVALID';
    console.log(`${status}: ${url.year} ${url.make} ${url.model} - ${result.reason || 'OK'}`);
    
    if (result.valid) validCount++;
    else invalidCount++;
}

console.log(`\n=== Summary ===`);
console.log(`Valid: ${validCount}`);
console.log(`Invalid: ${invalidCount}`);
console.log(`\nInvalid pages should return 404 or be removed from your site.`);
