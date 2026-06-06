import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Zod schema for structured application generation
 */
const ApplicationSchema = z.object({
  folderName: z.string().describe('Kebab-case folder name for the application'),
  description: z.string().describe('Brief description of what was created'),
  files: z.array(
    z.object({
      path: z.string().describe('Relative file path (e.g., src/App.jsx)'),
      content: z.string().describe('Complete file content'),
    })
  ).describe('All files needed for the application'),
  setupCommands: z.array(z.string()).describe('Bash commands to setup and run (e.g., npm install, npm run dev)'),
});

/**
 * Console logging helpers
 */
function printSystem(message) {
  console.log(message);
}

/**
 * Display file tree structure
 */
function displayFileTree(files, folderName) {
  printSystem(chalk.cyan('\n📂 Project Structure:'));
  printSystem(chalk.white(`${folderName}/`));
  
  const filesByDir = {};
  files.forEach(file => {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    
    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(parts[parts.length - 1]);
  });
  
  Object.keys(filesByDir).sort().forEach(dir => {
    if (dir) {
      printSystem(chalk.white(`├── ${dir}/`));
      filesByDir[dir].forEach(file => {
        printSystem(chalk.white(`│   └── ${file}`));
      });
    } else {
      filesByDir[dir].forEach(file => {
        printSystem(chalk.white(`├── ${file}`));
      });
    }
  });
}

/**
 * Create application files
 */
async function createApplicationFiles(baseDir, folderName, files) {
  const appDir = path.join(baseDir, folderName);
  
  await fs.mkdir(appDir, { recursive: true });
  printSystem(chalk.cyan(`\n📁 Created directory: ${folderName}/`));
  
  for (const file of files) {
    const filePath = path.join(appDir, file.path);
    const fileDir = path.dirname(filePath);
    
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, file.content, 'utf8');
    printSystem(chalk.green(`  ✓ ${file.path}`));
  }
  
  return appDir;
}

export async function generateApplication(description, aiService) {
  try {
    const result = await generateObject({
      model: aiService.model,
      schema: ApplicationSchema,
      prompt: `Create a complete, production-ready application for: ${description}

CRITICAL REQUIREMENTS:
1. Generate ALL files needed for the application to run
2. Include package.json with ALL dependencies and correct versions (if needed)
3. Include README.md with setup instructions
4. Include configuration files (.gitignore, etc.) if needed
5. Write clean, well-commented, production-ready code
6. Include error handling and input validation
7. Use modern JavaScript/TypeScript best practices
8. Make sure all imports and paths are correct
9. NO PLACEHOLDERS - everything must be complete and working
10. For simple HTML/CSS/JS projects, you can skip package.json if not needed

Provide:
- A meaningful kebab-case folder name
- All necessary files with complete content
- Setup commands (for example: cd folder, npm install, npm run dev OR just open index.html)
- Make it visually appealing and functional`,
    });
    
    return {
      success: true,
      application: result.object,
    };
    
  } catch (err) {
    console.error(`\n❌ Error generating application: ${err.message}\n`);
    throw err;
  }
}