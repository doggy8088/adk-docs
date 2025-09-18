#!/usr/bin/env node

// Demo script showing how to use the translation tool on a specific file
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');

async function runDemo() {
    console.log('🚀 Translation Tool Demo\n');
    
    // Check if required environment variables are set
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
        console.log('❌ Missing Azure OpenAI configuration!');
        console.log('Please set up your .env file with:');
        console.log('- AZURE_OPENAI_API_KEY');
        console.log('- AZURE_OPENAI_ENDPOINT');
        console.log('- AZURE_OPENAI_DEPLOYMENT_NAME (optional)');
        console.log('\nCopy .env.example to .env and fill in your credentials.\n');
        return;
    }
    
    try {
        // Create a demo markdown file
        const demoContent = `# Agent Development Kit Demo

Welcome to the Agent Development Kit (ADK), a powerful framework for building AI agents.

## Key Features

- **Model-agnostic**: Works with various LLM providers
- **Cloud deployment**: Deploy to Google Cloud or other platforms  
- **Tool integration**: Connect with external APIs and services
- **Quality evaluation**: Built-in evaluation framework

## Quick Start

1. Install the SDK:
   \`\`\`bash
   pip install google-adk
   \`\`\`

2. Create your first agent:
   \`\`\`python
   from google.adk.agents import LlmAgent
   
   agent = LlmAgent(
       name="hello_agent",
       model="gemini-1.5-flash",
       instruction="You are a helpful assistant."
   )
   \`\`\`

Visit our [documentation](https://github.com/google/adk-docs) for more examples.`;
        
        const demoFile = 'demo-translation.md';
        await fs.writeFile(demoFile, demoContent);
        console.log(`📝 Created demo file: ${demoFile}`);
        
        // Import and run translation on this specific file
        const { DocumentTranslator } = require('./translate.js');
        
        // Override the file finder to only process our demo file
        class DemoTranslator extends DocumentTranslator {
            async run() {
                try {
                    this.logger.info('Starting demo translation...');
                    await this.translateDocument(demoFile);
                    this.dictionary.saveDictionary();
                    this.logger.success('Demo translation completed!');
                } catch (error) {
                    this.logger.error(`Demo translation failed: ${error.message}`);
                    throw error;
                }
            }
        }
        
        const translator = new DemoTranslator();
        await translator.run();
        
        // Show results
        const outputFile = `demo-translation_zh-tw.md`;
        if (await fs.pathExists(outputFile)) {
            console.log('\n📋 Translation completed! Files created:');
            console.log(`- ${outputFile} (translated content)`);
            console.log(`- ${demoFile}.backup (original backup)`);
            console.log('- translation-dictionary.json (shared dictionary)');
            console.log('- translation.log (detailed logs)');
            
            console.log('\n📖 First few lines of translated content:');
            const translatedContent = await fs.readFile(outputFile, 'utf-8');
            const lines = translatedContent.split('\n').slice(0, 10);
            console.log(lines.join('\n'));
            console.log('...\n');
        }
        
        // Cleanup demo files if user wants
        console.log('🧹 Demo files created. Run with --cleanup to remove them.');
        if (process.argv.includes('--cleanup')) {
            await fs.remove(demoFile);
            await fs.remove(`${demoFile}.backup`);
            await fs.remove(outputFile);
            console.log('✅ Demo files cleaned up.');
        }
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
            console.log('\n💡 This might be an API authentication issue.');
            console.log('Please verify your Azure OpenAI credentials in the .env file.');
        }
    }
}

if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };