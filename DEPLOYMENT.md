# Deployment Guide

## Building Executables with Bundled Chrome

This guide explains how to create standalone executables that include Chrome/Chromium and work across different platforms.

## Prerequisites

- Node.js 18 or higher
- All dependencies installed (`npm install`)

## Building Process

### 1. Prepare Build Environment

```bash
npm run prebuild
```

This downloads and prepares Chromium for packaging.

### 2. Build Platform-Specific Executables

#### Windows Only
```bash
npm run build-win
```
Creates: `dist/CliendoIOM-win.exe`

#### macOS Only  
```bash
npm run build-mac
```
Creates: `dist/CliendoIOM-mac`

#### Linux Only
```bash
npm run build-linux
```
Creates: `dist/CliendoIOM-linux`

#### All Platforms
```bash
npm run build-all
```
Creates all three executables

## Platform Compatibility

| Build Platform | Target Platform | Status | Notes |
|----------------|----------------|---------|-------|
| Windows | Windows | ✅ Works | Includes Chrome.exe |
| Windows | macOS | ❌ Won't Work | Different architecture & Chrome binary |
| Windows | Linux | ❌ Won't Work | Different architecture & Chrome binary |
| macOS | macOS | ✅ Works | Includes Chromium.app |
| macOS | Windows | ❌ Won't Work | Different architecture & Chrome binary |
| macOS | Linux | ❌ Won't Work | Different architecture & Chrome binary |
| Linux | Linux | ✅ Works | Includes chrome binary |
| Linux | Windows | ❌ Won't Work | Different architecture & Chrome binary |
| Linux | macOS | ❌ Won't Work | Different architecture & Chrome binary |

## Important Notes

### Cross-Platform Building
- **You cannot build a macOS executable on Windows** - the PKG tool creates platform-specific binaries
- **Each platform needs its own Chromium binary** - Chrome/Chromium executables are platform-specific
- **To distribute to all platforms**, you need to build on each target platform

### File Sizes
- Windows executable: ~150-200MB (includes Chrome)
- macOS executable: ~150-200MB (includes Chromium)  
- Linux executable: ~150-200MB (includes Chrome)

### Distribution Strategy

#### Option 1: Platform-Specific Builds
Build on each target platform:
1. Build Windows .exe on Windows machine
2. Build macOS binary on Mac machine  
3. Build Linux binary on Linux machine

#### Option 2: GitHub Actions (Recommended)
Use GitHub Actions to automatically build for all platforms:

```yaml
# .github/workflows/build.yml
name: Build Executables
on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run prebuild
      - run: npm run build-win
        if: matrix.os == 'windows-latest'
      - run: npm run build-mac  
        if: matrix.os == 'macos-latest'
      - run: npm run build-linux
        if: matrix.os == 'ubuntu-latest'
      - uses: actions/upload-artifact@v3
        with:
          name: executables-${{ matrix.os }}
          path: dist/
```

## Troubleshooting

### "Bundled Chromium not found"
- Run `npm run prebuild` before building
- Check that `local-chromium/` directory exists and contains Chrome files
- Verify the correct platform-specific Chrome binary is present

### "Cannot find Chrome executable"
- The executable falls back to system Chrome if bundled version fails
- Ensure target system has Chrome installed if bundled version doesn't work

### Large File Sizes
- This is normal - Chrome/Chromium is ~100-150MB
- Consider using electron-builder for more advanced packaging options

### Platform-Specific Issues

#### Windows
- Antivirus may flag the executable - this is normal for packaged Node.js apps
- May need to run as administrator depending on target directory

#### macOS
- Executable may need to be code-signed for distribution
- Users may need to allow the app in Security & Privacy settings

#### Linux
- May need to mark as executable: `chmod +x CliendoIOM-linux`
- Some distributions may require additional dependencies

## Environment Variables

**⚠️ SECURITY NOTICE**: For security reasons, API keys are NOT bundled with the executable.

### Setting up API Keys

Users must provide their own OpenAI API key using one of these methods:

1. **Environment File (Recommended)**:
   - Copy `.env.example` to `.env` next to the executable
   - Edit `.env` and add: `OPENAI_API_KEY=your_actual_key`

2. **System Environment Variable**:
   - Windows: `set OPENAI_API_KEY=your_key`
   - macOS/Linux: `export OPENAI_API_KEY=your_key`

### Distribution Package

When distributing, include:
- `CliendoIOM.exe` (or platform equivalent)
- `.env.example` (template file)
- `API_KEY_SETUP.txt` (setup instructions)

**Do NOT include** your actual `.env` file with real API keys!

## Security Considerations

- **API keys are NOT bundled** - Users must provide their own OpenAI API key
- **Template files included** - `.env.example` and setup instructions are provided
- **Chrome security** - Chrome runs with debugging enabled and reduced security for automation
- **Distribution** - Only distribute the executable and template files, never real API keys
