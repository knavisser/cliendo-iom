// pre-build.js - Script to prepare Chromium for packaging
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function prepareBuild() {
  console.log('🔧 Preparing build environment...');
  
  // Ensure Puppeteer has downloaded Chromium
  console.log('📥 Ensuring Chromium is downloaded...');
  const browser = await puppeteer.launch({ headless: true });
  await browser.close();
  
  // Get the Chromium path
  const chromiumPath = puppeteer.executablePath();
  console.log('🎯 Chromium located at:', chromiumPath);
  
  // Create a local chromium directory
  const localChromiumDir = path.join(__dirname, 'local-chromium');
  if (!fs.existsSync(localChromiumDir)) {
    fs.mkdirSync(localChromiumDir, { recursive: true });
  }
  
  // Copy Chromium executable and required files
  const chromiumDir = path.dirname(chromiumPath);
  const localChromiumPath = path.join(localChromiumDir, 'chrome.exe');
  
  console.log('📁 Copying Chromium files...');
  
  // Copy the entire chrome directory to maintain dependencies
  const sourceDir = chromiumDir;
  const targetDir = path.join(localChromiumDir, 'chrome-win64');
  
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(sourceDir, targetDir);
  
  console.log('✅ Chromium prepared for packaging');
  console.log('📍 Local Chromium path:', path.join(targetDir, 'chrome.exe'));
}

if (require.main === module) {
  prepareBuild().catch(console.error);
}

module.exports = prepareBuild;
