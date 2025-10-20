// build-cross-platform.js - Cross-platform build script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function buildForPlatform(platform) {
  console.log(`🔨 Building for ${platform}...`);
  
  // Platform-specific configurations
  const configs = {
    win: {
      target: 'node18-win-x64',
      output: 'dist/CliendoIOM-win.exe',
      chromiumSubPath: 'chrome-win64/chrome.exe'
    },
    mac: {
      target: 'node18-macos-x64', 
      output: 'dist/CliendoIOM-mac',
      chromiumSubPath: 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'
    },
    linux: {
      target: 'node18-linux-x64',
      output: 'dist/CliendoIOM-linux',
      chromiumSubPath: 'chrome-linux/chrome'
    }
  };
  
  const config = configs[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  
  // Create platform-specific boot-all.js
  const bootAllContent = fs.readFileSync('boot-all.js', 'utf8');
  const platformBootAll = bootAllContent.replace(
    'chrome-win64/chrome.exe',
    config.chromiumSubPath
  );
  
  const tempBootFile = `boot-all-${platform}.js`;
  fs.writeFileSync(tempBootFile, platformBootAll);
  
  // Update package.json temporarily
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const originalBin = packageJson.bin;
  packageJson.bin = tempBootFile;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  try {
    // Build the executable
    execSync(`pkg . --targets ${config.target} --output ${config.output}`, {
      stdio: 'inherit'
    });
    
    console.log(`✅ Built ${config.output}`);
  } finally {
    // Restore original package.json
    packageJson.bin = originalBin;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    // Clean up temp file
    if (fs.existsSync(tempBootFile)) {
      fs.unlinkSync(tempBootFile);
    }
  }
}

async function main() {
  const platform = process.argv[2];
  
  if (!platform) {
    console.log('Usage: node build-cross-platform.js [win|mac|linux|all]');
    process.exit(1);
  }
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  if (platform === 'all') {
    await buildForPlatform('win');
    await buildForPlatform('mac');
    await buildForPlatform('linux');
  } else {
    await buildForPlatform(platform);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
