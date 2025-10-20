// boot-all.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Global browser instance to share between modules
let globalBrowser = null;

async function launchBrowserWithDebugging() {
  console.log('🚀 Launching bundled Chromium...');
  
  const userDataDir = path.join(os.tmpdir(), `chrome-iom-profile-${Date.now()}`);
  console.log(`💾 Using userDataDir: ${userDataDir}`);

  try {
    const browser = await puppeteer.launch({
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
        '--disable-renderer-backgrounding'
      ]
    });

    console.log('✅ Chromium launched successfully');
    
    // Open the target page
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
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
