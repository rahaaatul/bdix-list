import ping from 'ping';

interface UrlEntry {
    name: string;
    url: string;
    type: string;
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

async function checkUrl(entry: UrlEntry): Promise<{ url: string; name: string; isUp: boolean }> {
    const hostname = extractHostname(entry.url);

    try {
        const result = await ping.promise.probe(hostname, {
            timeout: 2,
            extra: ['-c', '1', '-W', '2000']
        });

        return {
            url: entry.url,
            name: entry.name,
            isUp: result.alive
        };
    } catch {
        return {
            url: entry.url,
            name: entry.name,
            isUp: false
        };
    }
}

async function listUpUrls() {
    console.log('🔍 Checking all URLs to find working ones...\n');

    const urls: UrlEntry[] = require('./bdix-urls.json');

    // Remove duplicates
    const seen = new Set();
    const uniqueUrls = urls.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });

    console.log(`📊 Checking ${uniqueUrls.length} unique URLs...`);

    // Check all URLs concurrently for speed
    const results = await Promise.all(
        uniqueUrls.map(entry => checkUrl(entry))
    );

    // Filter only UP URLs
    const upUrls = results.filter(result => result.isUp);

    console.log(`\n✅ Found ${upUrls.length} working URLs:\n`);
    console.log('='.repeat(80));

    // List all UP URLs
    upUrls.forEach((site, index) => {
        console.log(`${index + 1}. ${site.url}`);
        if (site.name && site.name !== 'UNKNOWN') {
            console.log(`   📝 ${site.name}`);
        }
        console.log('');
    });

    console.log('='.repeat(80));
    console.log(`📈 Summary: ${upUrls.length} working out of ${uniqueUrls.length} total URLs`);
    console.log(`📊 Success rate: ${((upUrls.length / uniqueUrls.length) * 100).toFixed(1)}%`);

    // Save just the working URLs to a file
    const workingUrls = upUrls.map(site => site.url);
    await Bun.write('working-urls.txt', workingUrls.join('\n'));

    // Also save as JSON with more details
    const detailedList = {
        timestamp: new Date().toISOString(),
        total_checked: uniqueUrls.length,
        working_count: upUrls.length,
        success_rate: parseFloat(((upUrls.length / uniqueUrls.length) * 100).toFixed(1)),
        working_urls: upUrls.map(site => ({
            url: site.url,
            name: site.name
        }))
    };

    await Bun.write('working-urls.json', JSON.stringify(detailedList, null, 2));

    console.log('\n💾 Results saved to:');
    console.log('   📄 working-urls.txt (simple list)');
    console.log('   📋 working-urls.json (detailed info)');
}

listUpUrls().catch(console.error); 