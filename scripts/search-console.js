/**
 * Google Search Console API Integration
 * 
 * Pull search performance data, identify opportunities, and track SEO progress.
 * 
 * Usage:
 *   node scripts/search-console.js                    # Show top queries (last 28 days)
 *   node scripts/search-console.js --pages            # Show top pages
 *   node scripts/search-console.js --opportunities    # Find low CTR opportunities
 *   node scripts/search-console.js --export           # Export full data to CSV
 *   node scripts/search-console.js --days 7           # Last 7 days instead of 28
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Config
const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com'; // Domain property format
const OUTPUT_DIR = path.join(__dirname, 'seo-reports');

class SearchConsoleService {
    constructor() {
        this.auth = null;
        this.webmasters = null;
        this.customDateRange = null;
    }

    async initialize() {
        if (!fs.existsSync(KEY_PATH)) {
            throw new Error(`Credentials file not found at ${KEY_PATH}`);
        }

        const keyFile = fs.readFileSync(KEY_PATH, 'utf8');
        const credentials = JSON.parse(keyFile);

        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        });

        this.webmasters = google.searchconsole({ version: 'v1', auth: this.auth });

        console.log('✓ Google Search Console API initialized');
        console.log(`  Service account: ${credentials.client_email}`);
        console.log(`  Site: ${SITE_URL}\n`);
    }

    getDateRange(days = 28) {
        if (this.customDateRange) {
            return this.customDateRange;
        }

        const end = new Date();
        end.setDate(end.getDate() - 1); // Yesterday (data isn't available for today)
        const start = new Date(end);
        start.setDate(start.getDate() - days);

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }

    setDateRange(startDate, endDate) {
        this.customDateRange = { startDate, endDate };
    }

    async getSearchAnalytics(options = {}) {
        const {
            dimensions = ['query'],
            rowLimit = 100,
            days = 28,
            startRow = 0,
        } = options;

        const { startDate, endDate } = this.getDateRange(days);

        try {
            const response = await this.webmasters.searchanalytics.query({
                siteUrl: SITE_URL,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit,
                    startRow,
                },
            });

            return response.data.rows || [];
        } catch (error) {
            if (error.message.includes('403') || error.message.includes('Forbidden')) {
                console.error('\n❌ Access Denied!');
                console.error('   Make sure the service account email is added as a user in Search Console.');
                console.error('   Go to: https://search.google.com/search-console');
                console.error('   Settings → Users and permissions → Add user');
                console.error(`   Add: (check your credentials file for the email)\n`);
            }
            throw error;
        }
    }

    async getTopQueries(limit = 50, days = 28) {
        const rows = await this.getSearchAnalytics({
            dimensions: ['query'],
            rowLimit: limit,
            days,
        });

        return rows.map(row => ({
            query: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: (row.ctr * 100).toFixed(1) + '%',
            position: row.position.toFixed(1),
        }));
    }

    async getTopPages(limit = 50, days = 28) {
        const rows = await this.getSearchAnalytics({
            dimensions: ['page'],
            rowLimit: limit,
            days,
        });

        return rows.map(row => ({
            page: row.keys[0].replace(SITE_URL, ''),
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: (row.ctr * 100).toFixed(1) + '%',
            position: row.position.toFixed(1),
        }));
    }

    async getQueryPageData(limit = 500, days = 28) {
        const rows = await this.getSearchAnalytics({
            dimensions: ['query', 'page'],
            rowLimit: limit,
            days,
        });

        return rows.map(row => ({
            query: row.keys[0],
            page: row.keys[1].replace(SITE_URL, ''),
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
        }));
    }

    async findOpportunities(days = 28) {
        console.log('🔍 Analyzing SEO opportunities...\n');

        const queries = await this.getSearchAnalytics({
            dimensions: ['query'],
            rowLimit: 500,
            days,
        });

        const opportunities = {
            lowCtrHighImpressions: [],   // Getting seen but not clicked
            almostPage1: [],              // Position 11-20 (page 2)
            quickWins: [],                // Position 1-10 but low CTR
            highPotential: [],            // High impressions, decent position
        };

        for (const row of queries) {
            const query = row.keys[0];
            const { clicks, impressions, ctr, position } = row;

            // Low CTR, High Impressions (top opportunity)
            if (impressions >= 5 && ctr < 0.02 && position <= 20) {
                opportunities.lowCtrHighImpressions.push({
                    query,
                    impressions,
                    clicks,
                    ctr: (ctr * 100).toFixed(1) + '%',
                    position: position.toFixed(1),
                    suggestion: 'Improve meta title/description for this query',
                });
            }

            // Almost Page 1 (position 11-20)
            if (position > 10 && position <= 20 && impressions >= 3) {
                opportunities.almostPage1.push({
                    query,
                    impressions,
                    position: position.toFixed(1),
                    suggestion: 'Add content, build links to push to page 1',
                });
            }

            // Page 1 but low CTR
            if (position <= 10 && ctr < 0.03 && impressions >= 3) {
                opportunities.quickWins.push({
                    query,
                    impressions,
                    ctr: (ctr * 100).toFixed(1) + '%',
                    position: position.toFixed(1),
                    suggestion: 'Improve title/description - you\'re on page 1!',
                });
            }

            // High potential (lots of impressions)
            if (impressions >= 10) {
                opportunities.highPotential.push({
                    query,
                    impressions,
                    clicks,
                    position: position.toFixed(1),
                });
            }
        }

        // Sort by opportunity value
        opportunities.lowCtrHighImpressions.sort((a, b) => b.impressions - a.impressions);
        opportunities.almostPage1.sort((a, b) => a.position - b.position);
        opportunities.quickWins.sort((a, b) => b.impressions - a.impressions);
        opportunities.highPotential.sort((a, b) => b.impressions - a.impressions);

        return opportunities;
    }

    async exportToCSV(days = 28) {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().split('T')[0];

        // Export queries
        const queries = await this.getSearchAnalytics({
            dimensions: ['query'],
            rowLimit: 1000,
            days,
        });

        const queriesCsv = 'Query,Clicks,Impressions,CTR,Position\n' +
            queries.map(r => `"${r.keys[0]}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)}`).join('\n');

        const queriesPath = path.join(OUTPUT_DIR, `queries-${timestamp}.csv`);
        fs.writeFileSync(queriesPath, queriesCsv);
        console.log(`✓ Exported queries to ${queriesPath}`);

        // Export pages
        const pages = await this.getSearchAnalytics({
            dimensions: ['page'],
            rowLimit: 1000,
            days,
        });

        const pagesCsv = 'Page,Clicks,Impressions,CTR,Position\n' +
            pages.map(r => `"${r.keys[0]}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)}`).join('\n');

        const pagesPath = path.join(OUTPUT_DIR, `pages-${timestamp}.csv`);
        fs.writeFileSync(pagesPath, pagesCsv);
        console.log(`✓ Exported pages to ${pagesPath}`);

        return { queriesPath, pagesPath };
    }
}

function printTable(data, columns) {
    if (data.length === 0) {
        console.log('  No data found\n');
        return;
    }

    // Calculate column widths
    const widths = {};
    for (const col of columns) {
        widths[col] = Math.max(col.length, ...data.map(row => String(row[col] || '').length));
    }

    // Print header
    const header = columns.map(col => col.padEnd(widths[col])).join(' | ');
    console.log('  ' + header);
    console.log('  ' + columns.map(col => '-'.repeat(widths[col])).join('-+-'));

    // Print rows
    for (const row of data.slice(0, 25)) {
        const line = columns.map(col => String(row[col] || '').padEnd(widths[col])).join(' | ');
        console.log('  ' + line);
    }

    if (data.length > 25) {
        console.log(`  ... and ${data.length - 25} more rows`);
    }
    console.log('');
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║         SpotOn Auto - Search Console Analytics               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const args = process.argv.slice(2);
    const daysArg = args.findIndex(a => a === '--days');
    const days = daysArg !== -1 ? parseInt(args[daysArg + 1]) || 28 : 28;
    const startArg = args.findIndex(a => a === '--start');
    const endArg = args.findIndex(a => a === '--end');
    const startDate = startArg !== -1 ? args[startArg + 1] : null;
    const endDate = endArg !== -1 ? args[endArg + 1] : null;

    const service = new SearchConsoleService();

    try {
        await service.initialize();

        if ((startDate && !endDate) || (!startDate && endDate)) {
            throw new Error('Use --start YYYY-MM-DD and --end YYYY-MM-DD together');
        }

        if (startDate && endDate) {
            service.setDateRange(startDate, endDate);
            console.log(`Using custom date range: ${startDate} to ${endDate}\n`);
        }

        if (args.includes('--opportunities')) {
            const opps = await service.findOpportunities(days);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 QUICK WINS - Page 1 with Low CTR (Improve titles/descriptions)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            printTable(opps.quickWins.slice(0, 15), ['query', 'impressions', 'ctr', 'position']);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📈 ALMOST PAGE 1 - Position 11-20 (Small push could rank #1)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            printTable(opps.almostPage1.slice(0, 15), ['query', 'impressions', 'position']);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('👀 HIGH IMPRESSIONS, LOW CLICKS (CTR problem)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            printTable(opps.lowCtrHighImpressions.slice(0, 15), ['query', 'impressions', 'ctr', 'position']);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔥 HIGHEST POTENTIAL (Most impressions)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            printTable(opps.highPotential.slice(0, 15), ['query', 'impressions', 'clicks', 'position']);

        } else if (args.includes('--pages')) {
            const pages = await service.getTopPages(50, days);
            console.log(`━━━━━━━ TOP PAGES (Last ${days} days) ━━━━━━━\n`);
            printTable(pages, ['page', 'clicks', 'impressions', 'ctr', 'position']);

        } else if (args.includes('--export')) {
            await service.exportToCSV(days);
            console.log('\n✓ Export complete!');

        } else {
            // Default: show top queries
            const queries = await service.getTopQueries(50, days);
            console.log(`━━━━━━━ TOP QUERIES (Last ${days} days) ━━━━━━━\n`);
            printTable(queries, ['query', 'clicks', 'impressions', 'ctr', 'position']);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('                          USAGE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  node scripts/search-console.js                  # Top queries');
            console.log('  node scripts/search-console.js --pages          # Top pages');
            console.log('  node scripts/search-console.js --opportunities  # Find SEO opps');
            console.log('  node scripts/search-console.js --export         # Export to CSV');
            console.log('  node scripts/search-console.js --days 7         # Last 7 days\n');
        }

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

module.exports = { SearchConsoleService };

if (require.main === module) {
    main();
}
