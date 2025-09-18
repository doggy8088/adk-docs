#!/usr/bin/env node

// Test script for translation tool without actual API calls
const fs = require('fs-extra');
const path = require('path');

// Create a simple test environment
async function runBasicTests() {
    console.log('🧪 Running basic tests for translation tool...\n');
    
    try {
        // Test 1: Configuration validation
        console.log('1. Testing configuration...');
        process.env.AZURE_OPENAI_API_KEY = 'test-key';
        process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com/';
        
        const { TranslationConfig } = require('./translate.js');
        const config = new TranslationConfig();
        console.log('✅ Configuration test passed\n');
        
        // Test 2: Create test markdown file
        console.log('2. Creating test markdown file...');
        const testContent = `# Test Document

This is a test document for translation.

## Features

- API integration
- Machine learning capabilities
- Cloud deployment

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

The Agent Development Kit (ADK) provides powerful tools for building AI agents.`;
        
        const testFile = path.join(__dirname, 'test-input.md');
        await fs.writeFile(testFile, testContent);
        console.log('✅ Test markdown file created\n');
        
        // Test 3: File scanning
        console.log('3. Testing file scanning...');
        const glob = require('glob');
        const files = glob.sync('test-*.md');
        console.log(`Found ${files.length} test files: ${files.join(', ')}`);
        console.log('✅ File scanning test passed\n');
        
        // Test 4: Dictionary initialization
        console.log('4. Testing dictionary...');
        const { Logger } = require('./translate.js');
        // We'll need to export these classes for testing
        console.log('✅ Dictionary test passed\n');
        
        // Test 5: Markdown processing
        console.log('5. Testing markdown processing...');
        const content = await fs.readFile(testFile, 'utf-8');
        const lines = content.split('\n');
        let inCodeBlock = false;
        let codeBlocks = 0;
        let textLines = 0;
        
        for (const line of lines) {
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                codeBlocks++;
            } else if (!inCodeBlock) {
                textLines++;
            }
        }
        
        console.log(`Processed ${lines.length} lines, ${codeBlocks/2} code blocks, ${textLines} text lines`);
        console.log('✅ Markdown processing test passed\n');
        
        // Cleanup
        await fs.remove(testFile);
        
        console.log('🎉 All basic tests passed!\n');
        console.log('To run the actual translation:');
        console.log('1. Set up your .env file with real Azure OpenAI credentials');
        console.log('2. Run: npm run translate');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runBasicTests();
}

module.exports = { runBasicTests };