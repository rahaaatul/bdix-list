import ping from 'ping';

interface UrlEntry {
    name: string;
    url: string;
    type: string;
}

interface SimpleResult {
    url: string;
    name: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
}

function extractHostname(urlString: string): string {
    try {
        const url = new URL(urlString);
        return url.hostname || '';
    } catch {
        const match = urlString.match(/^https?:\/\/([^:/]+)/);
        return match && match[1] ? match[1] : urlString;
    }
}

async function quickPing(entry: UrlEntry): Promise<SimpleResult> {
    const hostname = extractHostname(entry.url);
    const startTime = Date.now();

    try {
        const result = await ping.promise.probe(hostname, {
            timeout: 2, // 2 seconds timeout for speed
            extra: ['-c', '1', '-W', '2000'] // Single ping, 2s timeout
        });

        const responseTime = Date.now() - startTime;

        return {
            url: entry.url,
            name: entry.name,
            status: result.alive ? 'UP' : 'DOWN',
            responseTime
        };
    } catch {
        return {
            url: entry.url,
            name: entry.name,
            status: 'DOWN',
            responseTime: Date.now() - startTime
        };
    }
}

async function fastCheck() {
    console.log('🚀 Fast BDIX Connectivity Check');
    console.log('='.repeat(50));

    const urls: UrlEntry[] = require('./bdix-urls.json');

    // Remove duplicates quickly
    const seen = new Set();
    const uniqueUrls = urls.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });

    console.log(`📊 Checking ${uniqueUrls.length} unique URLs...`);
    console.log('⚡ Using fast mode (2s timeout, max concurrency)\n');

    const startTime = Date.now();

    // Maximum concurrency for speed - ping all at once
    const results = await Promise.all(
        uniqueUrls.map(entry => quickPing(entry))
    );

    const totalTime = Date.now() - startTime;

    // Quick sorting and reporting
    const upSites = results.filter(r => r.status === 'UP');
    const downSites = results.filter(r => r.status === 'DOWN');

    // Sort up sites by response time
    upSites.sort((a, b) => a.responseTime - b.responseTime);

    console.log('\n' + '='.repeat(60));
    console.log('📈 RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`🟢 UP: ${upSites.length} sites`);
    console.log(`🔴 DOWN: ${downSites.length} sites`);
    console.log(`📊 Success rate: ${((upSites.length / results.length) * 100).toFixed(1)}%`);
    console.log(`⚡ Total time: ${(totalTime / 1000).toFixed(1)}s`);

    if (upSites.length > 0) {
        const avgTime = upSites.reduce((sum, r) => sum + r.responseTime, 0) / upSites.length;
        console.log(`⏱️  Average response: ${avgTime.toFixed(0)}ms`);
    }

    // Show top 10 fastest
    console.log('\n🏆 TOP 10 FASTEST:');
    upSites.slice(0, 10).forEach((site, i) => {
        console.log(`${i + 1}. ${site.responseTime}ms - ${site.url}`);
    });

    // Show some failed sites
    if (downSites.length > 0) {
        console.log('\n💥 SOME FAILED SITES:');
        downSites.slice(0, 5).forEach((site, i) => {
            console.log(`${i + 1}. ${site.url}`);
        });
    }

    // Save simple results
    const simpleOutput = {
        timestamp: new Date().toISOString(),
        totalTime: totalTime,
        summary: {
            total: results.length,
            up: upSites.length,
            down: downSites.length,
            successRate: parseFloat(((upSites.length / results.length) * 100).toFixed(1))
        },
        upSites: upSites.map(s => ({ url: s.url, time: s.responseTime })),
        downSites: downSites.map(s => s.url)
    };

    await Bun.write('quick-results.json', JSON.stringify(simpleOutput, null, 2));
    console.log('\n✅ Done! Results saved to quick-results.json');
}

fastCheck().catch(console.error); 