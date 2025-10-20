# Cliendo IOM Assistant

An automation tool for generating and injecting PHP layout configuration files into the Cliendo platform using AI assistance and browser automation.

## Overview

This project automates the process of creating PHP layout configuration files for the Cliendo platform. It combines OpenAI's GPT API with Puppeteer browser automation to:

1. Generate PHP configuration files based on user input
2. Automatically inject the generated code into the Cliendo web interface
3. Provide an interactive chat interface for iterative development

## Features

- **AI-Powered Code Generation**: Uses OpenAI GPT to generate valid PHP layout configurations
- **Browser Automation**: Automatically injects code into the Cliendo platform using Puppeteer
- **Interactive Chat Interface**: Command-line interface for conversational code generation
- **Logging**: Comprehensive logging of all operations
- **Chrome Integration**: Launches Chrome with debugging capabilities for seamless automation

## Prerequisites

- Node.js (version 14 or higher)
- Google Chrome browser
- OpenAI API key
- Access to the Cliendo platform

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cliendo-iom-automatization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Building Portable Executable

⚠️ **Important**: Executables are platform-specific. A Windows .exe will NOT work on macOS or Linux.

### Build with Bundled Chrome

1. Prepare the build environment:
   ```bash
   npm run prebuild
   ```

2. Build platform-specific executable:
   ```bash
   # Windows (run on Windows)
   npm run build-win
   
   # macOS (run on macOS) 
   npm run build-mac
   
   # Linux (run on Linux)
   npm run build-linux
   
   # All platforms (requires appropriate OS)
   npm run build-all
   ```

The executables include Chrome/Chromium and can run on machines without Node.js or Chrome installed.

**File sizes**: ~150-200MB each (includes Chrome browser)

For detailed build instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Usage

### Running the Complete Automation

Execute the main script to launch the bundled Chromium and start the interactive assistant:

```bash
npm start
# or directly:
node boot-all.js
```

This will:
1. Launch the bundled Chromium browser with debugging enabled
2. Navigate to the Cliendo platform
3. Start the interactive chat interface
4. Allow you to generate and inject PHP configurations

### Individual Components

#### Chat and Inject
Run the interactive chat interface only:
```bash
node chat-and-inject.js
```

#### Code Injection Only
Inject pre-generated PHP code:
```bash
node inject-code.js "<encoded-php-code>"
```

## File Structure

- `boot-all.js` - Main entry point that launches Chrome and starts the assistant
- `chat-and-inject.js` - Interactive chat interface with OpenAI integration
- `inject-code.js` - Browser automation for code injection
- `package.json` - Node.js dependencies and build configuration
- `logs/` - Directory containing operation logs
- `.env` - Environment variables (not tracked in git)

## Configuration

### Bundled Chromium
The application now uses Puppeteer's bundled Chromium browser, eliminating the need for Chrome path detection. This makes the application fully portable.

### System Prompt
The AI system prompt can be customized in `current_system_prompt.txt` or within the code files.

## Generated PHP Structure

The tool generates PHP files with the following structure:

```php
<?php
$tabX = [
  'name' => '...',
  'localName' => '...',
  'forms' => [
    [
      'name' => '...',
      'localName' => '...',
      'type' => 'left' | 'right' | 'left full' | 'right full' | 'left full matrixWithComments',
      'css2' => '...', // optional
      'fields' => [ ... ],
      'choices' => [ ... ] // optional, only for matrix-style forms
    ]
  ]
];
?>
```

## Logging

All operations are logged to timestamped files in the `logs/` directory. Logs include:
- User interactions
- Generated code
- Injection results
- Error messages

## Security Notes

- The `.env` file containing your OpenAI API key is excluded from version control
- Chrome is launched with debugging enabled and security features disabled for automation purposes
- Only use this tool in development environments

## Troubleshooting

### Application Issues
Check the logs directory for detailed error information and error messages.

### OpenAI API Issues
Ensure your API key is valid and has sufficient credits. Check the logs for detailed error messages.

### Browser Issues
The application uses bundled Chromium, so browser-related issues should be minimal. If problems persist, try deleting temporary Chrome profile directories.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please check the logs directory for detailed error information and create an issue in the repository.
