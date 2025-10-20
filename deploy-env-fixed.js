// deploy-env.js - Create template files for deployment (NO REAL API KEYS)
const fs = require('fs');
const path = require('path');

function deployEnvironment() {
  console.log('🔧 Preparing deployment templates...');
  
  const distDir = path.join(__dirname, 'dist');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create .env.example template (NO REAL API KEY)
  const exampleEnvPath = path.join(distDir, '.env.example');
  const exampleContent = 'OPENAI_API_KEY=your_openai_api_key_here\n';
  fs.writeFileSync(exampleEnvPath, exampleContent);
  console.log(`✅ Created .env.example at ${exampleEnvPath}`);
  
  // Copy setup instructions
  const setupInstructionsSource = path.join(__dirname, 'API_KEY_SETUP.txt');
  const setupInstructionsTarget = path.join(distDir, 'API_KEY_SETUP.txt');
  
  if (fs.existsSync(setupInstructionsSource)) {
    fs.copyFileSync(setupInstructionsSource, setupInstructionsTarget);
    console.log(`✅ Copied setup instructions to ${setupInstructionsTarget}`);
  }
  
  console.log('');
  console.log('📦 Distribution package ready!');
  console.log('📁 Contents of dist/:');
  console.log('   - CliendoIOM-win.exe (or platform equivalent)');
  console.log('   - .env.example (template for users)');
  console.log('   - API_KEY_SETUP.txt (setup instructions)');
  console.log('');
  console.log('⚠️  IMPORTANT: Users must create their own .env file with their API key');
}

if (require.main === module) {
  deployEnvironment();
}

module.exports = deployEnvironment;
