#!/usr/bin/env node
/*
  Tool: promote-zh-tw-default
  Purpose:
    1) Rename all Markdown files (excluding *_zh-tw.md and *.en.md) from *.md -> *.en.md
    2) Move *_zh-tw.md to their corresponding original file path (drop _zh-tw suffix),
       effectively making zh-tw the default language filename.

  Safety:
    - Default is DRY RUN. Pass --execute to actually perform changes.
    - Use --force to overwrite if a destination exists (rare if step 1 runs first).

  Usage:
    node promote-zh-tw-default.js            # DRY RUN (no changes)
    node promote-zh-tw-default.js --execute  # Apply changes
    node promote-zh-tw-default.js --execute --force  # Force overwrite when needed
*/

const path = require('path');
const fs = require('fs-extra');
const { globSync } = require('glob');
const chalk = require('chalk');

// Configuration
const baseDir = path.resolve(__dirname, '..');
const excludes = [
  'translation-tool/**',
  '**/node_modules/**',
  '**/.git/**',
  'translation-tool/**',
  'site/**'
];

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const FORCE = args.includes('--force');

function logHeader(title) {
  console.log('\n' + chalk.cyan.bold('==> ' + title));
}

function formatAction(prefix, from, to) {
  return `${chalk.gray(prefix)} ${chalk.yellow(path.relative(baseDir, from))} ${chalk.gray('->')} ${chalk.green(path.relative(baseDir, to))}`;
}

function formatSingle(prefix, file) {
  return `${chalk.gray(prefix)} ${chalk.yellow(path.relative(baseDir, file))}`;
}

function getAll(pattern) {
  return globSync(pattern, { cwd: baseDir, dot: false, nodir: true, ignore: excludes }).map(p => path.join(baseDir, p));
}

function planRenamesToEnMd() {
  // All *.md except *_zh-tw.md and *.en.md
  const allMd = getAll('**/*.md');
  const candidates = allMd.filter(p => !p.endsWith('_zh-tw.md') && !p.endsWith('.en.md'));
  const actions = candidates.map(from => {
    const to = from.replace(/\.md$/, '.en.md');
    return { type: 'rename-to-en', from, to };
  });
  return actions;
}

function planMoveZhTwToDefault() {
  const zhTwFiles = getAll('**/*_zh-tw.md');
  const actions = zhTwFiles.map(from => {
    const to = from.replace(/_zh-tw\.md$/, '.md');
    return { type: 'move-zh-to-default', from, to };
  });
  return actions;
}

async function applyActions(actions) {
  let applied = 0;
  for (const action of actions) {
    if (action.type === 'rename-to-en') {
      if (!EXECUTE) {
        console.log(formatAction('[plan] rename', action.from, action.to));
        continue;
      }
      try {
        const exists = await fs.pathExists(action.to);
        if (exists && !FORCE) {
          console.log(chalk.yellow('Skip (exists): ') + formatAction('rename', action.from, action.to));
          continue;
        }
        await fs.ensureDir(path.dirname(action.to));
        await fs.move(action.from, action.to, { overwrite: FORCE });
        console.log(formatAction('[done] rename', action.from, action.to));
        applied++;
      } catch (err) {
        console.error(chalk.red('Error renaming: ' + err.message));
      }
    } else if (action.type === 'move-zh-to-default') {
      if (!EXECUTE) {
        console.log(formatAction('[plan] promote', action.from, action.to));
        continue;
      }
      try {
        const exists = await fs.pathExists(action.to);
        if (exists && !FORCE) {
          // If destination exists, we can overwrite if forced; otherwise skip to be safe
          console.log(chalk.yellow('Skip (exists): ') + formatAction('promote', action.from, action.to));
          continue;
        }
        await fs.ensureDir(path.dirname(action.to));
        await fs.move(action.from, action.to, { overwrite: FORCE });
        console.log(formatAction('[done] promote', action.from, action.to));
        applied++;
      } catch (err) {
        console.error(chalk.red('Error promoting: ' + err.message));
      }
    }
  }
  return applied;
}

async function main() {
  console.log(chalk.bold('promote-zh-tw-default'));
  console.log('Base directory:', chalk.magenta(baseDir));
  console.log('Mode:', EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN'));
  if (!EXECUTE) {
    console.log(chalk.gray('Tip: pass --execute to apply changes. Use --force to overwrite if needed.'));
  }

  logHeader('Phase 1: Rename *.md -> *.en.md (excluding *_zh-tw.md, *.en.md)');
  const phase1 = planRenamesToEnMd();
  console.log(chalk.gray(`Found ${phase1.length} file(s) to rename.`));
  await applyActions(phase1);

  logHeader('Phase 2: Promote *_zh-tw.md -> *.md');
  const phase2 = planMoveZhTwToDefault();
  console.log(chalk.gray(`Found ${phase2.length} file(s) to promote.`));
  await applyActions(phase2);

  logHeader('Summary');
  console.log(chalk.gray(`Planned renames: ${phase1.length}`));
  console.log(chalk.gray(`Planned promotions: ${phase2.length}`));
  if (EXECUTE) {
    console.log(chalk.green('Completed with changes applied.'));
  } else {
    console.log(chalk.yellow('DRY RUN completed. No changes were made.'));
  }
}

main().catch(err => {
  console.error(chalk.red(err.stack || err.message));
  process.exit(1);
});
