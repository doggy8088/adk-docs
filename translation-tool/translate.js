#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const { OpenAI } = require('openai');

/**
 * Translation configuration and utilities
 */
class TranslationConfig {
    constructor() {
        this.azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        this.azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
        this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
        
        this.sourceLanguage = process.env.SOURCE_LANGUAGE || 'en';
        this.targetLanguage = process.env.TARGET_LANGUAGE || 'zh-tw';
        this.maxRetries = parseInt(process.env.MAX_RETRIES || '3');
        this.qualityThreshold = parseInt(process.env.QUALITY_THRESHOLD || '7');
        
        this.inputPattern = process.env.INPUT_PATTERN || '**/*.md';
        this.outputSuffix = process.env.OUTPUT_SUFFIX || '_zh-tw';
        this.dictionaryFile = process.env.DICTIONARY_FILE || 'translation-dictionary.json';
        this.backupOriginal = process.env.BACKUP_ORIGINAL === 'true';
        
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logFile = process.env.LOG_FILE || 'translation.log';
        
        this.validateConfig();
    }
    
    validateConfig() {
        if (!this.azureApiKey || !this.azureEndpoint) {
            throw new Error('Missing required Azure OpenAI configuration. Please check AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.');
        }
    }
}

/**
 * Logger utility
 */
class Logger {
    constructor(config) {
        this.config = config;
        this.logFile = config.logFile;
    }
    
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        // Console output with colors
        switch (level) {
            case 'error':
                console.error(chalk.red(logEntry));
                break;
            case 'warn':
                console.warn(chalk.yellow(logEntry));
                break;
            case 'info':
                console.info(chalk.blue(logEntry));
                break;
            case 'success':
                console.log(chalk.green(logEntry));
                break;
            default:
                console.log(logEntry);
        }
        
        // File logging
        const fileEntry = data ? `${logEntry}\nData: ${JSON.stringify(data, null, 2)}\n` : `${logEntry}\n`;
        fs.appendFileSync(this.logFile, fileEntry);
    }
    
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    success(message, data) { this.log('success', message, data); }
}

/**
 * Translation dictionary manager
 */
class TranslationDictionary {
    constructor(dictionaryFile, logger) {
        this.dictionaryFile = dictionaryFile;
        this.logger = logger;
        this.dictionary = this.loadDictionary();
        this.specialTerms = this.initializeSpecialTerms();
    }
    
    loadDictionary() {
        try {
            if (fs.existsSync(this.dictionaryFile)) {
                const data = fs.readFileSync(this.dictionaryFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            this.logger.warn(`Failed to load dictionary: ${error.message}`);
        }
        return {};
    }
    
    saveDictionary() {
        try {
            fs.writeFileSync(this.dictionaryFile, JSON.stringify(this.dictionary, null, 2));
            this.logger.info(`Dictionary saved to ${this.dictionaryFile}`);
        } catch (error) {
            this.logger.error(`Failed to save dictionary: ${error.message}`);
        }
    }
    
    initializeSpecialTerms() {
        return {
            // Technical terms that should remain in English or be bilingual
            'API': 'API',
            'SDK': 'SDK',
            'ADK': 'Agent Development Kit (ADK)',
            'Agent Development Kit': 'Agent Development Kit (ADK)',
            'GitHub': 'GitHub',
            'Google Cloud': 'Google Cloud',
            'Vertex AI': 'Vertex AI',
            'Gemini': 'Gemini',
            'OpenAI': 'OpenAI',
            'LLM': '大型語言模型 (LLM)',
            'Large Language Model': '大型語言模型 (Large Language Model)',
            'Python': 'Python',
            'Java': 'Java',
            'JavaScript': 'JavaScript',
            'Node.js': 'Node.js',
            'JSON': 'JSON',
            'REST': 'REST',
            'HTTP': 'HTTP',
            'HTTPS': 'HTTPS',
            'URL': 'URL',
            'URI': 'URI',
            'CLI': '命令列介面 (CLI)',
            'Command Line Interface': '命令列介面 (Command Line Interface)',
            'Docker': 'Docker',
            'Kubernetes': 'Kubernetes',
            'Maven': 'Maven',
            'pip': 'pip',
            'npm': 'npm'
        };
    }
    
    getTranslation(term) {
        return this.dictionary[term] || this.specialTerms[term] || null;
    }
    
    addTranslation(original, translation) {
        this.dictionary[original] = translation;
    }
    
    applyDictionaryToText(text) {
        let processedText = text;
        
        // Apply special terms first
        for (const [original, translation] of Object.entries(this.specialTerms)) {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            processedText = processedText.replace(regex, translation);
        }
        
        // Apply dictionary terms
        for (const [original, translation] of Object.entries(this.dictionary)) {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            processedText = processedText.replace(regex, translation);
        }
        
        return processedText;
    }
}

/**
 * Azure OpenAI translator
 */
class AzureOpenAITranslator {
    constructor(config, logger, dictionary) {
        this.config = config;
        this.logger = logger;
        this.dictionary = dictionary;
        this.client = new OpenAI({
            apiKey: config.azureApiKey,
            baseURL: `${config.azureEndpoint}/openai/deployments/${config.deploymentName}`,
            defaultQuery: { 'api-version': config.apiVersion },
            defaultHeaders: {
                'api-key': config.azureApiKey,
            },
        });
    }
    
    async translateText(text, context = '') {
        const translationPrompt = this.buildTranslationPrompt(text, context);
        
        try {
            const response = await this.client.chat.completions.create({
                model: this.config.deploymentName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional technical translator specializing in software documentation. Translate accurately while preserving technical terms and maintaining readability in Traditional Chinese (zh-tw).'
                    },
                    {
                        role: 'user',
                        content: translationPrompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3
            });
            
            const translation = response.choices[0].message.content.trim();
            return this.dictionary.applyDictionaryToText(translation);
            
        } catch (error) {
            this.logger.error(`Translation failed: ${error.message}`);
            throw error;
        }
    }
    
    async analyzeQuality(originalText, translatedText) {
        const qualityPrompt = `
請分析以下翻譯的品質（1-10分）：

原文：
${originalText}

譯文：
${translatedText}

請評估以下方面並給出總分：
1. 準確性 (準確傳達原意)
2. 流暢性 (中文表達自然)
3. 專業性 (技術術語使用恰當)
4. 一致性 (術語翻譯一致)

回應格式：
分數: [1-10]
評析: [詳細說明]
改進建議: [具體建議]
        `;
        
        try {
            const response = await this.client.chat.completions.create({
                model: this.config.deploymentName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a translation quality analyst. Analyze the translation quality and provide constructive feedback in Traditional Chinese.'
                    },
                    {
                        role: 'user',
                        content: qualityPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            });
            
            return this.parseQualityResponse(response.choices[0].message.content);
            
        } catch (error) {
            this.logger.error(`Quality analysis failed: ${error.message}`);
            return { score: 5, analysis: '無法分析品質', suggestions: '請手動檢查翻譯' };
        }
    }
    
    async improveTranslation(originalText, translatedText, qualityFeedback) {
        const improvementPrompt = `
請根據品質分析意見改進以下翻譯：

原文：
${originalText}

初始譯文：
${translatedText}

品質分析：
${qualityFeedback.analysis}

改進建議：
${qualityFeedback.suggestions}

請提供改進後的翻譯：
        `;
        
        try {
            const response = await this.client.chat.completions.create({
                model: this.config.deploymentName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional translator. Improve the translation based on the quality feedback provided.'
                    },
                    {
                        role: 'user',
                        content: improvementPrompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.2
            });
            
            const improvedTranslation = response.choices[0].message.content.trim();
            return this.dictionary.applyDictionaryToText(improvedTranslation);
            
        } catch (error) {
            this.logger.error(`Translation improvement failed: ${error.message}`);
            return translatedText; // Return original translation if improvement fails
        }
    }
    
    buildTranslationPrompt(text, context) {
        return `
請將以下英文技術文件翻譯成繁體中文（zh-tw）：

上下文：${context || '技術文件'}

原文：
${text}

翻譯要求：
1. 保持技術準確性
2. 使用自然的繁體中文表達
3. 專有名詞可保留英文或提供中英對照
4. 保持原有的Markdown格式
5. 程式碼區塊不要翻譯
6. 連結和路徑不要翻譯

譯文：
        `;
    }
    
    parseQualityResponse(response) {
        const lines = response.split('\n');
        let score = 5;
        let analysis = '';
        let suggestions = '';
        
        for (const line of lines) {
            if (line.includes('分數:') || line.includes('評分:')) {
                const match = line.match(/(\d+)/);
                if (match) score = parseInt(match[1]);
            } else if (line.includes('評析:')) {
                analysis = line.split('評析:')[1]?.trim() || '';
            } else if (line.includes('改進建議:')) {
                suggestions = line.split('改進建議:')[1]?.trim() || '';
            }
        }
        
        return { score, analysis, suggestions };
    }
}

/**
 * File processor for markdown files
 */
class MarkdownProcessor {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    
    async findMarkdownFiles() {
        try {
            const files = glob.sync(this.config.inputPattern, {
                ignore: [
                    'node_modules/**',
                    'translation-tool/**',
                    '.git/**',
                    '**/.*/**',
                    `**/*${this.config.outputSuffix}.md`
                ]
            });
            
            this.logger.info(`Found ${files.length} markdown files`);
            return files;
            
        } catch (error) {
            this.logger.error(`Failed to find markdown files: ${error.message}`);
            throw error;
        }
    }
    
    async readFile(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            this.logger.error(`Failed to read file ${filePath}: ${error.message}`);
            throw error;
        }
    }
    
    async writeFile(filePath, content) {
        try {
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, content, 'utf-8');
            this.logger.success(`Written translated file: ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to write file ${filePath}: ${error.message}`);
            throw error;
        }
    }
    
    async backupFile(filePath) {
        if (!this.config.backupOriginal) return;
        
        try {
            const backupPath = `${filePath}.backup`;
            await fs.copy(filePath, backupPath);
            this.logger.info(`Backup created: ${backupPath}`);
        } catch (error) {
            this.logger.warn(`Failed to create backup for ${filePath}: ${error.message}`);
        }
    }
    
    generateOutputPath(inputPath) {
        const dir = path.dirname(inputPath);
        const name = path.basename(inputPath, '.md');
        return path.join(dir, `${name}${this.config.outputSuffix}.md`);
    }
    
    extractSections(content) {
        // Split content into translatable sections
        // This is a simplified approach - you might want to use a proper markdown parser
        const sections = [];
        const lines = content.split('\n');
        let currentSection = '';
        let inCodeBlock = false;
        
        for (const line of lines) {
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                if (currentSection.trim()) {
                    sections.push({ type: 'text', content: currentSection.trim() });
                    currentSection = '';
                }
                sections.push({ type: 'code', content: line });
                continue;
            }
            
            if (inCodeBlock) {
                sections.push({ type: 'code', content: line });
            } else {
                currentSection += line + '\n';
            }
        }
        
        if (currentSection.trim()) {
            sections.push({ type: 'text', content: currentSection.trim() });
        }
        
        return sections;
    }
}

/**
 * Main translation orchestrator
 */
class DocumentTranslator {
    constructor() {
        this.config = new TranslationConfig();
        this.logger = new Logger(this.config);
        this.dictionary = new TranslationDictionary(this.config.dictionaryFile, this.logger);
        this.translator = new AzureOpenAITranslator(this.config, this.logger, this.dictionary);
        this.processor = new MarkdownProcessor(this.config, this.logger);
    }
    
    async translateDocument(filePath) {
        this.logger.info(`Starting translation of: ${filePath}`);
        
        try {
            const content = await this.processor.readFile(filePath);
            const sections = this.processor.extractSections(content);
            const translatedSections = [];
            
            for (const section of sections) {
                if (section.type === 'code') {
                    translatedSections.push(section.content);
                } else {
                    let translation = await this.translator.translateText(section.content, filePath);
                    
                    // Quality check and improvement
                    const quality = await this.translator.analyzeQuality(section.content, translation);
                    this.logger.info(`Quality score: ${quality.score}/10 for section in ${filePath}`);
                    
                    if (quality.score < this.config.qualityThreshold) {
                        this.logger.warn(`Low quality translation detected, attempting improvement...`);
                        translation = await this.translator.improveTranslation(section.content, translation, quality);
                    }
                    
                    translatedSections.push(translation);
                }
            }
            
            const translatedContent = translatedSections.join('\n');
            const outputPath = this.processor.generateOutputPath(filePath);
            
            await this.processor.backupFile(filePath);
            await this.processor.writeFile(outputPath, translatedContent);
            
            this.logger.success(`Successfully translated: ${filePath} -> ${outputPath}`);
            
        } catch (error) {
            this.logger.error(`Failed to translate ${filePath}: ${error.message}`);
            throw error;
        }
    }
    
    async run() {
        try {
            this.logger.info('Starting automatic translation process...');
            
            const files = await this.processor.findMarkdownFiles();
            
            for (const file of files) {
                let retries = 0;
                while (retries < this.config.maxRetries) {
                    try {
                        await this.translateDocument(file);
                        break;
                    } catch (error) {
                        retries++;
                        if (retries >= this.config.maxRetries) {
                            this.logger.error(`Failed to translate ${file} after ${this.config.maxRetries} retries`);
                            break;
                        }
                        this.logger.warn(`Retry ${retries}/${this.config.maxRetries} for ${file}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
                    }
                }
            }
            
            this.dictionary.saveDictionary();
            this.logger.success('Translation process completed!');
            
        } catch (error) {
            this.logger.error(`Translation process failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI execution
if (require.main === module) {
    const translator = new DocumentTranslator();
    translator.run().catch(error => {
        console.error(chalk.red(`Fatal error: ${error.message}`));
        process.exit(1);
    });
}

module.exports = { DocumentTranslator, TranslationConfig };