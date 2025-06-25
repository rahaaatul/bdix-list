import ping from 'ping';
import { URL } from 'url';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

interface UrlEntry {
    name: string;
    url: string;
    type: string;
}

interface PingStatistics {
    min: number;
    max: number;
    avg: number;
    stddev: number;
    loss: number;
}

interface DnsInfo {
    ip?: string;
    hostname: string;
    resolveTime: number;
    error?: string;
}

interface PingResult {
    url: string;
    name: string;
    type: string;
    status: 'UP' | 'DOWN' | 'PARTIAL';
    attempts: number;
    successfulPings: number;
    statistics: PingStatistics;
    dnsInfo: DnsInfo;
    port?: number;
    isHttps: boolean;
    totalTime: number;
    timestamp: string;
    error?: string;
    rawPingResults: Array<{
        alive: boolean;
        time: number;
        attempt: number;
    }>;
}

interface PingConfig {
    attempts: number;
    timeout: number;
    interval: number;
    batchSize: number;
    enableDnsLookup: boolean;
    enablePortCheck: boolean;
}

const DEFAULT_CONFIG: PingConfig = {
    attempts: 5,
    timeout: 5000,
    interval: 500,
    batchSize: 8,
    enableDnsLookup: true,
    enablePortCheck: true
};

function extractHostAndPort(urlString: string): { hostname: string; port?: number; isHttps: boolean } {
    try {
        const url = new URL(urlString);
        return {
            hostname: url.hostname || '',
            port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80),
            isHttps: url.protocol === 'https:'
        };
    } catch {
        // Fallback for malformed URLs
        const match = urlString.match(/^https?:\/\/([^:/]+)(?::(\d+))?/);
        if (match && match[1]) {
            return {
                hostname: match[1],
                port: match[2] ? parseInt(match[2]) : (urlString.startsWith('https') ? 443 : 80),
                isHttps: urlString.startsWith('https')
            };
        }
        throw new Error('Invalid URL format');
    }
}

async function performDnsLookup(hostname: string): Promise<DnsInfo> {
    const startTime = Date.now();
    try {
        const result = await dnsLookup(hostname);
        return {
            ip: result.address,
            hostname,
            resolveTime: Date.now() - startTime
        };
    } catch (error) {
        return {
            hostname,
            resolveTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

function calculateStatistics(times: number[]): PingStatistics {
    if (times.length === 0) {
        return { min: 0, max: 0, avg: 0, stddev: 0, loss: 100 };
    }

    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;

    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    const stddev = Math.sqrt(variance);

    return { min, max, avg, stddev, loss: 0 };
}

async function advancedPingUrl(entry: UrlEntry, config: PingConfig = DEFAULT_CONFIG): Promise<PingResult> {
    const startTime = Date.now();
    console.log(`🔍 Advanced testing ${entry.name} - ${entry.url}`);

    try {
        const { hostname, port, isHttps } = extractHostAndPort(entry.url);

        // DNS Lookup
        let dnsInfo: DnsInfo = { hostname, resolveTime: 0 };
        if (config.enableDnsLookup) {
            console.log(`   🔍 DNS lookup for ${hostname}...`);
            dnsInfo = await performDnsLookup(hostname);
            if (dnsInfo.error) {
                console.log(`   ❌ DNS failed: ${dnsInfo.error}`);
            } else {
                console.log(`   ✅ DNS resolved: ${hostname} -> ${dnsInfo.ip} (${dnsInfo.resolveTime}ms)`);
            }
        }

        // Multiple ping attempts
        console.log(`   🏓 Performing ${config.attempts} ping attempts...`);
        const rawPingResults: Array<{ alive: boolean; time: number; attempt: number }> = [];
        const successfulTimes: number[] = [];

        for (let i = 0; i < config.attempts; i++) {
            try {
                const pingStart = Date.now();
                const result = await ping.promise.probe(hostname, {
                    timeout: config.timeout / 1000, // ping package expects seconds
                    extra: ['-c', '1'] // Single ping
                });

                const pingTime = result.time === 'unknown' ? Date.now() - pingStart : parseFloat(String(result.time));

                rawPingResults.push({
                    alive: result.alive,
                    time: pingTime,
                    attempt: i + 1
                });

                if (result.alive) {
                    successfulTimes.push(pingTime);
                    console.log(`   📊 Ping ${i + 1}/${config.attempts}: ${pingTime.toFixed(2)}ms ✅`);
                } else {
                    console.log(`   📊 Ping ${i + 1}/${config.attempts}: FAILED ❌`);
                }

                // Wait between attempts (except for the last one)
                if (i < config.attempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, config.interval));
                }
            } catch (error) {
                rawPingResults.push({
                    alive: false,
                    time: config.timeout,
                    attempt: i + 1
                });
                console.log(`   📊 Ping ${i + 1}/${config.attempts}: ERROR - ${error instanceof Error ? error.message : String(error)} ❌`);
            }
        }

        const successfulPings = successfulTimes.length;
        const statistics = calculateStatistics(successfulTimes);
        statistics.loss = ((config.attempts - successfulPings) / config.attempts) * 100;

        let status: 'UP' | 'DOWN' | 'PARTIAL' = 'DOWN';
        if (successfulPings === config.attempts) {
            status = 'UP';
        } else if (successfulPings > 0) {
            status = 'PARTIAL';
        }

        const totalTime = Date.now() - startTime;

        console.log(`   📈 Results: ${successfulPings}/${config.attempts} successful (${statistics.loss.toFixed(1)}% loss)`);
        if (successfulTimes.length > 0) {
            console.log(`   ⚡ Timing: ${statistics.min.toFixed(2)}/${statistics.avg.toFixed(2)}/${statistics.max.toFixed(2)}ms (min/avg/max)`);
        }

        return {
            url: entry.url,
            name: entry.name,
            type: entry.type,
            status,
            attempts: config.attempts,
            successfulPings,
            statistics,
            dnsInfo,
            port,
            isHttps,
            totalTime,
            timestamp: new Date().toISOString(),
            rawPingResults
        };

    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.log(`   💥 Failed: ${error instanceof Error ? error.message : String(error)}`);

        return {
            url: entry.url,
            name: entry.name,
            type: entry.type,
            status: 'DOWN',
            attempts: config.attempts,
            successfulPings: 0,
            statistics: { min: 0, max: 0, avg: 0, stddev: 0, loss: 100 },
            dnsInfo: { hostname: entry.url, resolveTime: 0 },
            totalTime,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            rawPingResults: [],
            isHttps: false
        };
    }
}

function categorizeByNetwork(results: PingResult[]): Record<string, PingResult[]> {
    const categories: Record<string, PingResult[]> = {};

    results.forEach(result => {
        const ip = result.dnsInfo.ip;
        if (!ip) {
            if (!categories['Unknown']) categories['Unknown'] = [];
            categories['Unknown'].push(result);
            return;
        }

        const parts = ip.split('.');
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.x`;

        if (!categories[subnet]) categories[subnet] = [];
        categories[subnet].push(result);
    });

    return categories;
}

function generateDetailedReport(results: PingResult[]) {
    const upResults = results.filter(r => r.status === 'UP');
    const partialResults = results.filter(r => r.status === 'PARTIAL');
    const downResults = results.filter(r => r.status === 'DOWN');

    console.log('\n' + '='.repeat(100));
    console.log('📊 ADVANCED PING ANALYSIS REPORT');
    console.log('='.repeat(100));

    console.log(`🟢 FULLY UP: ${upResults.length} sites`);
    console.log(`🟡 PARTIALLY UP: ${partialResults.length} sites`);
    console.log(`🔴 DOWN: ${downResults.length} sites`);
    console.log(`📈 Overall success rate: ${((upResults.length + partialResults.length * 0.5) / results.length * 100).toFixed(1)}%`);

    if (upResults.length > 0) {
        const avgResponseTime = upResults.reduce((sum, r) => sum + r.statistics.avg, 0) / upResults.length;
        const minResponseTime = Math.min(...upResults.map(r => r.statistics.min));
        const maxResponseTime = Math.max(...upResults.map(r => r.statistics.max));

        console.log(`⚡ Response time stats: ${minResponseTime.toFixed(2)}/${avgResponseTime.toFixed(2)}/${maxResponseTime.toFixed(2)}ms (min/avg/max)`);
    }

    // Network categorization
    console.log('\n' + '='.repeat(100));
    console.log('🌐 NETWORK ANALYSIS');
    console.log('='.repeat(100));

    const categories = categorizeByNetwork(results);
    Object.entries(categories)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 10)
        .forEach(([subnet, sites]) => {
            const upCount = sites.filter(s => s.status === 'UP').length;
            const partialCount = sites.filter(s => s.status === 'PARTIAL').length;
            console.log(`📡 ${subnet}: ${sites.length} sites (🟢${upCount} 🟡${partialCount} 🔴${sites.length - upCount - partialCount})`);
        });

    // Top performers
    console.log('\n' + '='.repeat(100));
    console.log('🏆 TOP 15 FASTEST SITES');
    console.log('='.repeat(100));

    upResults
        .sort((a, b) => a.statistics.avg - b.statistics.avg)
        .slice(0, 15)
        .forEach((result, index) => {
            const consistency = result.statistics.stddev < 10 ? '🎯' : result.statistics.stddev < 50 ? '📊' : '📈';
            console.log(`${index + 1}. ${result.name || result.url}`);
            console.log(`   🌐 ${result.url}`);
            console.log(`   ⚡ ${result.statistics.avg.toFixed(2)}ms avg (${result.statistics.min.toFixed(2)}-${result.statistics.max.toFixed(2)}ms) ${consistency}`);
            console.log(`   📡 ${result.dnsInfo.ip || 'N/A'} | 🏷️ ${result.type} | 🔒 ${result.isHttps ? 'HTTPS' : 'HTTP'}`);
            console.log('');
        });

    // Problem sites
    if (partialResults.length > 0) {
        console.log('\n' + '='.repeat(100));
        console.log('⚠️  UNSTABLE SITES (PARTIAL CONNECTIVITY)');
        console.log('='.repeat(100));

        partialResults
            .sort((a, b) => b.successfulPings - a.successfulPings)
            .slice(0, 10)
            .forEach((result, index) => {
                console.log(`${index + 1}. ${result.name || result.url}`);
                console.log(`   🌐 ${result.url}`);
                console.log(`   📊 ${result.successfulPings}/${result.attempts} successful (${(100 - result.statistics.loss).toFixed(1)}% success rate)`);
                if (result.statistics.avg > 0) {
                    console.log(`   ⚡ ${result.statistics.avg.toFixed(2)}ms avg when successful`);
                }
                console.log('');
            });
    }

    // Failed sites
    console.log('\n' + '='.repeat(100));
    console.log('💥 FAILED SITES (SAMPLE)');
    console.log('='.repeat(100));

    downResults
        .slice(0, 15)
        .forEach((result, index) => {
            console.log(`${index + 1}. ${result.name || result.url}`);
            console.log(`   🌐 ${result.url}`);
            console.log(`   💥 ${result.error || result.dnsInfo.error || 'Complete ping failure'}`);
            if (result.dnsInfo.error) {
                console.log(`   🔍 DNS: ${result.dnsInfo.error}`);
            }
            console.log('');
        });
}

async function runAdvancedPingTest() {
    console.log('🚀 Starting Advanced BDIX Ping Analysis...');
    console.log('='.repeat(60));

    const urls: UrlEntry[] = require('./bdix-urls.json');
    console.log(`📊 Loaded ${urls.length} URLs from bdix-urls.json\n`);

    // Remove duplicates
    const uniqueUrls = Array.from(
        new Map(urls.map((item) => [item.url, item])).values()
    );
    console.log(`🔄 Testing ${uniqueUrls.length} unique URLs...\n`);

    const config: PingConfig = {
        attempts: 3, // Reduced for faster execution, but still multiple attempts
        timeout: 5000,
        interval: 300,
        batchSize: 6, // Smaller batches for more controlled testing
        enableDnsLookup: true,
        enablePortCheck: true
    };

    console.log(`⚙️  Configuration:`);
    console.log(`   📊 ${config.attempts} ping attempts per site`);
    console.log(`   ⏱️  ${config.timeout}ms timeout`);
    console.log(`   📦 Batch size: ${config.batchSize}`);
    console.log(`   🔍 DNS lookup: ${config.enableDnsLookup ? 'enabled' : 'disabled'}`);
    console.log('');

    const results: PingResult[] = [];
    let processed = 0;

    for (let i = 0; i < uniqueUrls.length; i += config.batchSize) {
        const batch = uniqueUrls.slice(i, i + config.batchSize);
        const batchNum = Math.floor(i / config.batchSize) + 1;
        const totalBatches = Math.ceil(uniqueUrls.length / config.batchSize);

        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (URLs ${i + 1}-${Math.min(i + config.batchSize, uniqueUrls.length)})`);
        console.log('─'.repeat(80));

        const batchResults = await Promise.all(
            batch.map(entry => advancedPingUrl(entry, config))
        );

        results.push(...batchResults);
        processed += batch.length;

        const percentage = ((processed / uniqueUrls.length) * 100).toFixed(1);
        console.log(`✅ Batch ${batchNum} complete! Progress: ${processed}/${uniqueUrls.length} (${percentage}%)\n`);

        // Small delay between batches to avoid overwhelming the network
        if (i + config.batchSize < uniqueUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Sort results by average response time for successful pings
    results.sort((a, b) => {
        if (a.status === 'UP' && b.status !== 'UP') return -1;
        if (a.status !== 'UP' && b.status === 'UP') return 1;
        if (a.status === 'UP' && b.status === 'UP') {
            return a.statistics.avg - b.statistics.avg;
        }
        return 0;
    });

    generateDetailedReport(results);

    console.log('\n💾 Saving comprehensive results to ping-results.json...');
    await Bun.write('ping-results.json', JSON.stringify(results, null, 2));

    console.log('✅ Advanced ping analysis complete! Check ping-results.json for detailed data.');
    console.log(`📊 Final Summary: ${results.filter(r => r.status === 'UP').length} UP | ${results.filter(r => r.status === 'PARTIAL').length} PARTIAL | ${results.filter(r => r.status === 'DOWN').length} DOWN`);
}

runAdvancedPingTest().catch(console.error);