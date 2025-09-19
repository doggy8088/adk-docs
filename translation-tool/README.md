# ADK Documentation Translation Tool

This folder contains a Node.js-based automatic translation system for translating ADK documentation from English to Traditional Chinese (zh-tw) using Azure OpenAI Service.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Azure OpenAI**:
   ```bash
   cp .env.example .env
   # Edit .env with your Azure OpenAI credentials
   ```

3. **Run translation**:
   ```bash
   # Full translation of all markdown files
   npm run translate
   
   # Demo with sample file
   npm run demo
   
   # Basic functionality tests
   npm test
   ```

4. **Promote zh-tw as default filenames (dry-run by default)**:
   ```bash
   # Preview planned changes (no modifications)
   npm run promote:zh-tw-default

   # Apply changes (rename *.md -> *.en.md, then promote *_zh-tw.md -> *.md)
   npm run promote:zh-tw-default -- --execute

   # Apply changes and overwrite if destination exists
   npm run promote:zh-tw-default -- --execute --force
   ```

## Files

- `translate.js` - Main translation orchestrator
- `package.json` - Node.js project configuration
- `.env.example` - Environment variables template
- `TRANSLATION_README.md` - Comprehensive documentation (Chinese)
- `TRANSLATION_DEMO.md` - Live demonstration with examples
- `test-translation.js` - Basic functionality tests
- `demo-translation.js` - Demo script
- `promote-zh-tw-default.js` - Utility to rename `*.md` -> `*.en.md` and promote `*_zh-tw.md` -> `*.md`

## Features

- 🔄 Automatic scanning of all `*.md` files
- 🧠 Azure OpenAI integration with quality analysis
- 📚 Shared dictionary for consistent terminology
- 🔧 Specialized term handling (bilingual format)
- 🛡️ Error handling and retry mechanisms
- 📝 Comprehensive logging and backup

For detailed documentation, see [TRANSLATION_README.md](TRANSLATION_README.md).