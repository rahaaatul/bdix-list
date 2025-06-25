interface UrlEntry {
    name: string;
    url: string;
    type: string;
}

interface PingResult {
    url: string;
    name: string;
    type: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    statusCode?: number;
    error?: string;
}

async function pingUrl(entry: UrlEntry): Promise<PingResult> {
    const startTime = Date.now();

    try {
        // Try HEAD request first
        let response;
        try {
            response = await fetch(entry.url, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000), // 5 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
        } catch (headError) {
            // If HEAD fails, try GET request
            response = await fetch(entry.url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
        }

        const responseTime = Date.now() - startTime;

        return {
            url: entry.url,
            name: entry.name,
            type: entry.type,
            status: response.ok ? 'UP' : 'DOWN',
            responseTime,
            statusCode: response.status,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
            url: entry.url,
            name: entry.name,
            type: entry.type,
            status: 'DOWN',
            responseTime,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function testPing() {
    console.log('🧪 Testing with first 20 URLs...');

    const urls: UrlEntry[] = require('./bdix-urls.json');
    const testUrls = urls.slice(0, 20); // Only test first 20

    console.log(`📊 Testing ${testUrls.length} URLs\n`);

    const results: PingResult[] = [];

    for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i]!;
        console.log(`🔍 Testing ${i + 1}/${testUrls.length}: ${url.url}`);

        const result = await pingUrl(url);
        results.push(result);

        const status = result.status === 'UP' ? '🟢' : '🔴';
        console.log(`   ${status} ${result.status} - ${result.responseTime}ms ${result.statusCode ? `(${result.statusCode})` : ''}`);
        if (result.error) {
            console.log(`   💥 Error: ${result.error}`);
        }
        console.log('');
    }

    // Summary
    const upCount = results.filter(r => r.status === 'UP').length;
    const downCount = results.filter(r => r.status === 'DOWN').length;

    console.log('\n' + '='.repeat(50));
    console.log('📈 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`🟢 UP: ${upCount} URLs`);
    console.log(`🔴 DOWN: ${downCount} URLs`);
    console.log(`📊 Success rate: ${((upCount / results.length) * 100).toFixed(1)}%`);

    if (upCount > 0) {
        const avgResponseTime = results
            .filter(r => r.status === 'UP')
            .reduce((sum, r) => sum + r.responseTime, 0) / upCount;
        console.log(`⚡ Average response time: ${avgResponseTime.toFixed(2)}ms`);
    }
}

// Run the test
testPing().catch(console.error); 