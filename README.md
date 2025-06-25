# 🌐 BDIX List - Bangladesh Internet Exchange Connectivity Tester

[![Bun](https://img.shields.io/badge/Bun-✨-yellow?style=flat-square&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-💪-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A comprehensive, high-performance tool for testing BDIX (Bangladesh Internet Exchange) network connectivity. This tool helps you discover and test available local servers, FTP sites, streaming services, and other resources within the BDIX network ecosystem.

## ✨ Features

- 🚀 **Lightning Fast Testing**: Quick ping tests with 2-second timeout for rapid connectivity checks
- 📊 **Advanced Analytics**: Detailed ping analysis with comprehensive statistics and network metrics
- 🔍 **Smart Discovery**: Intelligent filtering to find all currently accessible servers and services
- 🌐 **DNS Resolution Testing**: Advanced hostname resolution timing and validation
- 📈 **Network Categorization**: Automatic grouping by service type (FTP, Streaming, Unknown)
- 📋 **Multiple Output Formats**: Results in JSON, TXT, and formatted console output
- ⚡ **Concurrent Processing**: Optimized batch processing for maximum speed
- 🎯 **Detailed Reports**: Comprehensive statistics with min/max/avg response times

## 🏗️ Project Structure

```
bdix-list/
├── 📄 bdix-urls.json      # Comprehensive database of 4000+ BDIX URLs
├── 🔧 list.ts             # Advanced ping testing with detailed analytics
├── ⚡ simple-ping.ts      # Fast connectivity checker for quick tests
├── 🔍 list-up.ts          # Working URLs discovery and filtering
├── 📝 type.ts             # TypeScript type definitions
├── ⚙️ package.json        # Project configuration and scripts
└── 📖 README.md           # This documentation
```

## 📋 Prerequisites

- **[Bun Runtime](https://bun.sh)** v1.0.0 or higher installed on your system
- **Network Access**: Best results when connected to a BDIX-enabled ISP in Bangladesh
- **Operating System**: macOS, Linux, or Windows with WSL

## 🛠️ Installation

1. **Clone or download this repository**:
   ```bash
   git clone <repository-url>
   cd bdix-list
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Verify installation**:
   ```bash
   bun --version
   ```

## 🚀 Usage Guide

The tool provides **4 distinct testing modes** optimized for different use cases:

### 1. 🏃‍♂️ Quick Start (Recommended for Beginners)

```bash
# Default quick test - fastest way to get started
bun start
# or
bun run quick
# or 
bun run fast
```

**What it does:**
- ⚡ Ultra-fast ping tests with 2-second timeout per URL
- 🚀 Tests all 4000+ URLs simultaneously using maximum concurrency
- 🏆 Shows top 10 fastest responding sites
- 📊 Provides instant success rate and performance metrics
- 💾 Saves results to `quick-results.json`

**Perfect for:**
- Quick network health checks
- Finding fastest available servers
- Daily connectivity verification
- Initial BDIX network assessment

---

### 2. 🔬 Advanced Analysis (For Detailed Diagnostics)

```bash
# Comprehensive testing with detailed analytics
bun run detailed
# or
bun run analyze
# or
bun run ping
# or
bun run dev
```

**What it does:**
- 🎯 Performs 5 ping attempts per URL with comprehensive statistics
- 🌐 DNS resolution testing with timing analysis
- 📈 Network categorization and advanced reporting
- 📊 Detailed metrics: min/max/avg response times, packet loss, standard deviation
- 🗂️ Results categorized by network type (FTP, TV/Streaming, Unknown)
- 💾 Saves detailed results to `ping-results.json`

**Perfect for:**
- Network troubleshooting and diagnostics
- Performance analysis and optimization
- Detailed connectivity reports
- ISP performance evaluation

---

### 3. 🎯 Working URLs Discovery (For Clean Lists)

```bash
# Find only working/accessible URLs
bun run find-working
# or
bun run list-up
```

**What it does:**
- 🔍 Tests all URLs and filters only currently working ones
- 📝 Creates clean, curated lists of accessible servers
- 💾 Saves to both `working-urls.txt` (simple list) and `working-urls.json` (detailed)
- 📊 Provides success rate statistics

**Perfect for:**
- Creating curated server lists for applications
- Filtering out dead/inactive URLs
- Generating up-to-date BDIX resource lists
- Maintenance and cleanup operations

---

### 4. 🔧 Custom Testing (For Power Users)

```bash
# Run individual scripts directly
bun run list.ts           # Advanced testing script
bun run simple-ping.ts    # Fast connectivity checker  
bun run list-up.ts        # Working URLs finder

# Alternative quick commands
bun test                  # Same as quick test
```

## 📁 Output Files & Formats

The tool generates several types of output files:

### 📊 `quick-results.json` (Fast Test Results)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalTime": 3200,
  "summary": {
    "total": 150,
    "up": 45,
    "down": 105,
    "successRate": 30.0
  },
  "upSites": [
    { "url": "http://circleftp.net", "time": 89 }
  ],
  "downSites": ["http://example-down.com"]
}
```

### 📈 `ping-results.json` (Detailed Test Results)
```json
{
  "url": "http://circleftp.net",
  "name": "CIRCLE",
  "status": "UP",
  "attempts": 5,
  "successfulPings": 5,
  "statistics": {
    "min": 89.23,
    "avg": 91.45,
    "max": 95.67,
    "stddev": 2.1,
    "loss": 0.0
  },
  "dnsInfo": {
    "ip": "103.231.4.58",
    "hostname": "circleftp.net",
    "resolveTime": 45
  }
}
```

### 📝 `working-urls.txt` (Simple List)
```
http://circleftp.net
http://dhakaftp.com
http://amarsangam.com
```

### 📋 `working-urls.json` (Detailed Working URLs)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "total_checked": 150,
  "working_count": 45,
  "success_rate": 30.0,
  "working_urls": [
    {
      "url": "http://circleftp.net",
      "name": "CIRCLE"
    }
  ]
}
```

## 📊 Understanding Results

### 🚦 Status Indicators
- **🟢 UP**: Server is fully accessible and responding consistently
- **🟡 PARTIAL**: Server responds to some ping attempts (intermittent connectivity)
- **🔴 DOWN**: Server is not accessible or not responding

### ⏱️ Response Time Metrics
- **min/avg/max**: Minimum, average, and maximum response times in milliseconds
- **stddev**: Standard deviation (lower values indicate more consistent performance)
- **loss**: Percentage of failed ping attempts (0% = perfect, 100% = completely down)

### 🏷️ Network Categories
- **FTP**: File transfer protocol servers (downloads, file sharing)
- **TV**: Streaming and media servers (IPTV, video content)
- **UNKNOWN**: Unclassified servers (web services, games, etc.)

## ⚙️ Configuration & Customization

### Advanced Configuration Options

You can modify testing parameters by editing the configuration in `list.ts`:

```typescript
const DEFAULT_CONFIG: PingConfig = {
    attempts: 5,              // Number of ping attempts per URL
    timeout: 5000,            // Timeout in milliseconds (5 seconds)
    interval: 500,            // Delay between ping attempts (0.5 seconds)
    batchSize: 8,             // Number of concurrent tests
    enableDnsLookup: true,    // Enable DNS resolution testing
    enablePortCheck: true     // Enable port connectivity testing
};
```

### Customizing for Your Network

```typescript
// For faster testing (less accurate)
const FAST_CONFIG = {
    attempts: 3,
    timeout: 2000,
    interval: 200,
    batchSize: 16
};

// For more reliable results (slower)
const RELIABLE_CONFIG = {
    attempts: 10,
    timeout: 10000,
    interval: 1000,
    batchSize: 4
};
```

## 📊 Sample Output Examples

### 🚀 Fast Check Results
```
🚀 Fast BDIX Connectivity Check
==================================================
📊 Checking 150 unique URLs...
⚡ Using fast mode (2s timeout, max concurrency)

============================================================
📈 RESULTS SUMMARY
============================================================
🟢 UP: 45 sites
🔴 DOWN: 105 sites  
📊 Success rate: 30.0%
⚡ Total time: 3.2s
⏱️ Average response: 125ms

🏆 TOP 10 FASTEST:
1. 89ms - http://circleftp.net
2. 156ms - http://dhakaftp.com
3. 178ms - http://amarsangam.com
4. 203ms - http://teacher.com.bd
5. 234ms - http://ftp.jagobd.com
...

✅ Done! Results saved to quick-results.json
```

### 🔬 Advanced Test Results  
```
🔍 Advanced testing CIRCLE - http://new.circleftp.net
   🔍 DNS lookup for new.circleftp.net...
   ✅ DNS resolved: new.circleftp.net -> 103.231.4.58 (45ms)
   🏓 Performing 5 ping attempts...
   📊 Ping 1/5: 89.23ms ✅
   📊 Ping 2/5: 92.15ms ✅
   📊 Ping 3/5: 87.45ms ✅
   📊 Ping 4/5: 95.67ms ✅
   📊 Ping 5/5: 91.82ms ✅
   📈 Results: 5/5 successful (0.0% loss)
   ⚡ Timing: 87.45/91.45/95.67ms (min/avg/max)
```

## 🌐 Data Source

The tool uses `bdix-urls.json` containing **4000+ carefully curated BDIX servers** including:

- 📁 **FTP Servers**: File download and sharing services
- 📺 **Media Streaming**: IPTV, video content, and entertainment  
- 🎮 **Game Servers**: Local gaming and entertainment servers
- 🎓 **Educational Resources**: University and institutional servers
- 🌐 **Local Websites**: Bangladesh-based web services and portals
- 💼 **Business Services**: Enterprise and commercial servers

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🆕 Adding New URLs
```bash
# Edit bdix-urls.json and add new entries
{
  "name": "SERVER_NAME",
  "url": "http://server-url.com",
  "type": "FTP" | "TV" | "UNKNOWN"
}
```

### 🐛 Reporting Issues
- Report dead/inactive URLs
- Suggest feature improvements
- Report bugs or connectivity issues
- Share performance optimization ideas

### 💡 Feature Requests
- New testing modes
- Additional output formats
- Integration with other tools
- UI/UX improvements

## 🔧 Troubleshooting

### ❌ Common Issues & Solutions

**No results showing:**
```bash
# Check your BDIX connection
bun run quick    # Try fast mode first

# Verify you're on a BDIX-enabled ISP
ping circleftp.net
```

**Slow performance:**
```bash
# Use fast mode for quicker results
bun start

# Or reduce batch size in configuration
# Edit list.ts and change batchSize to 4
```

**Permission errors:**
```bash
# On Linux/macOS, you might need sudo for ping
sudo bun run quick

# Or install iputils-ping (Ubuntu/Debian)
sudo apt-get install iputils-ping
```

**DNS resolution failures:**
```bash
# Check your DNS settings
nslookup circleftp.net

# Try using Google DNS (8.8.8.8, 8.8.4.4)
```

### 🔍 Debugging Tips

1. **Test individual URLs**:
   ```bash
   ping circleftp.net
   curl -I http://circleftp.net
   ```

2. **Check network connectivity**:
   ```bash
   bun run quick    # Should show some UP results
   ```

3. **Verify BDIX access**:
   - Best results from Bangladesh ISPs (Grameenphone, Robi, Banglalink, etc.)
   - Test during off-peak hours (2 AM - 8 AM BD time)

## 📝 Notes & Best Practices

### 🌍 Geographic Considerations
- **Optimal Location**: Bangladesh with BDIX-enabled ISP
- **Peak Hours**: Avoid 6 PM - 12 AM BD time for best performance  
- **ISP Compatibility**: Works best with major BD ISPs

### ⚡ Performance Tips
- Use **fast mode** for daily checks
- Use **detailed mode** for troubleshooting
- Run tests during **off-peak hours** for accurate results
- **Close bandwidth-heavy applications** during testing

### 🔒 Network Security
- All tests use standard ICMP ping (safe and non-intrusive)
- No data is uploaded or downloaded during testing
- Results are stored locally only

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bangladesh Internet Exchange (BDIX)** for providing local connectivity infrastructure
- **Bun.sh** for the amazing JavaScript runtime
- **ping package** for reliable network testing capabilities
- **TypeScript** for type safety and developer experience

---

<div align="center">

**Made with ❤️ for the Bangladesh tech community**

[Report Bug](../../issues) • [Request Feature](../../issues) • [Contribute](../../pulls)

</div>
