// boot-all.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Global browser instance to share between modules
let globalBrowser = null;

function getChromiumPath() {
  // Check if we're running from a packaged executable
  const isPackaged = process.pkg !== undefined;
  
  if (isPackaged) {
    // When packaged, look for bundled Chromium based on platform
    const platform = os.platform();
    let chromiumRelativePath;
    
    switch (platform) {
      case 'win32':
        chromiumRelativePath = path.join('local-chromium', 'chrome-win64', 'chrome.exe');
        break;
      case 'darwin':
        chromiumRelativePath = path.join('local-chromium', 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
        break;
      case 'linux':
        chromiumRelativePath = path.join('local-chromium', 'chrome-linux', 'chrome');
        break;
      default:
        console.log('⚠️  Unsupported platform for bundled Chromium:', platform);
        return puppeteer.executablePath();
    }
    
    const bundledChromePath = path.join(path.dirname(process.execPath), chromiumRelativePath);
    if (fs.existsSync(bundledChromePath)) {
      console.log('🎯 Using bundled Chromium:', bundledChromePath);
      return bundledChromePath;
    } else {
      console.log('⚠️  Bundled Chromium not found at:', bundledChromePath);
      console.log('📁 Falling back to Puppeteer default');
    }
  }
  
  // Default: use Puppeteer's bundled Chromium
  return puppeteer.executablePath();
}

async function launchBrowserWithDebugging() {
  console.log('🚀 Launching Chromium...');
  
  const userDataDir = path.join(os.tmpdir(), `chrome-iom-profile-${Date.now()}`);
  console.log(`💾 Using userDataDir: ${userDataDir}`);

  const chromiumPath = getChromiumPath();
  console.log(`🎯 Chromium executable: ${chromiumPath}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: false,
      devtools: false,
      userDataDir: userDataDir,
      args: [
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--remote-allow-origins=*',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1400,900'
      ]
    });

    console.log('✅ Chromium launched successfully');
    
    // Open the target page
    const page = await browser.newPage();
    await page.setViewport(null); // Allow responsive viewport
    
    console.log('🌐 Navigating to Cliendo platform...');
    await page.goto('https://secure.cliendo.com/d8v3/inrichting/details/', {
      waitUntil: 'networkidle0'
    });
    
    console.log('✅ Page loaded successfully');
    return browser;
    
  } catch (error) {
    console.error('❌ Failed to launch Chromium:', error.message);
    throw error;
  }
}

// Export the browser instance for use in other modules
module.exports = {
  getBrowser: () => globalBrowser,
  setBrowser: (browser) => { globalBrowser = browser; }
};

(async () => {
  try {
    console.log('🏁 Starting Cliendo IOM Assistant...');
    
    // Launch browser and set global instance
    globalBrowser = await launchBrowserWithDebugging();
    module.exports.setBrowser(globalBrowser);
    
    console.log('✅ Browser ready. Starting interactive assistant...\n');
    
    // Start the chat interface
    require('./chat-and-inject.js').main();
    
  } catch (err) {
    console.error('❌ Failed to start application:', err.message);
    process.exit(1);
  }
})();
