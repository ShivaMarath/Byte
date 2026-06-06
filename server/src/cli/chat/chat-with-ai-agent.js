import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, confirm } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../commands/auth/login.js";
import fs from 'fs/promises';
import path from 'path';

const API_BASE = process.env.BYTE_API_URL ?? "https://byte-7lsq.onrender.com";

async function getUserFromToken() {
  const token = await getStoredToken();

  if (!token?.access_token) {
    throw new Error("Not authenticated. Please run 'byte login' first.");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { authorization: `Bearer ${token.access_token}` },
  });

  if (!res.ok) {
    spinner.error("Authentication failed");
    throw new Error("User not found. Please login again.");
  }

  const session = await res.json();
  spinner.success(`Welcome back, ${session.user.name}!`);
  return { user: session.user, token: token.access_token };
}

async function initConversation(token, conversationId = null) {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ mode: "agent", conversationId })
  });

  if (!res.ok) {
    throw new Error("Failed to load conversation");
  }
  const conversation = await res.json();

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` +
    `${chalk.gray("ID:")} ${conversation.id}\n` +
    `${chalk.gray("Mode:")} ${chalk.magenta("Agent (Code Generator)")}\n` +
    `${chalk.cyan("Working Directory:")} ${process.cwd()}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "🤖 Agent Mode",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo);
  return conversation;
}

function printSystem(message) {
  console.log(message);
}

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

async function agentLoop(token, conversation) {
  const helpBox = boxen(
    `${chalk.cyan.bold("What can the agent do?")}\n\n` +
    `${chalk.gray("• Generate complete applications from descriptions")}\n` +
    `${chalk.gray("• Create all necessary files and folders")}\n` +
    `${chalk.gray("• Include setup instructions and commands")}\n` +
    `${chalk.gray("• Generate production-ready code")}\n\n` +
    `${chalk.yellow.bold("Examples:")}\n` +
    `${chalk.white('• "Build a todo app with React and Tailwind"')}\n` +
    `${chalk.white('• "Create a REST API with Express and MongoDB"')}\n` +
    `${chalk.white('• "Make a weather app using OpenWeatherMap API"')}\n\n` +
    `${chalk.gray('Type "exit" to end the session')}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💡 Agent Instructions",
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.magenta("🤖 What would you like to build?"),
      placeholder: "Describe your application...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description cannot be empty";
        }
        if (value.trim().length < 10) {
          return "Please provide more details (at least 10 characters)";
        }
      },
    });

    if (isCancel(userInput)) {
      console.log(chalk.yellow("\n👋 Agent session cancelled\n"));
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("\n👋 Agent session ended\n"));
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 Your Request",
      titleAlignment: "left",
    });
    console.log(userBox);

    try {
      const spinner = yoctoSpinner({ text: "Generating structured output..." }).start();
      const res = await fetch(`${API_BASE}/api/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: userInput })
      });

      if (!res.ok) {
        throw new Error("Generation failed from server");
      }
      
      const result = await res.json();
      spinner.stop();

      if (result && result.success) {
        const application = result.application;
        printSystem(chalk.green(`\n✅ Generated: ${application.folderName}\n`));
        printSystem(chalk.gray(`Description: ${application.description}\n`));
        printSystem(chalk.green(`Files: ${application.files.length}\n`));
        
        displayFileTree(application.files, application.folderName);
        
        printSystem(chalk.cyan('\n📝 Creating files...\n'));
        const appDir = await createApplicationFiles(process.cwd(), application.folderName, application.files);
        
        printSystem(chalk.green.bold(`\n✨ Application created successfully!\n`));
        printSystem(chalk.cyan(`📁 Location: ${chalk.bold(appDir)}\n`));
        
        if (application.setupCommands && application.setupCommands.length > 0) {
          printSystem(chalk.cyan('📋 Next Steps:\n'));
          printSystem(chalk.white('```bash'));
          application.setupCommands.forEach(cmd => {
            printSystem(chalk.white(cmd));
          });
          printSystem(chalk.white('```\n'));
        }

        const continuePrompt = await confirm({
          message: chalk.cyan("Would you like to generate another application?"),
          initialValue: false,
        });

        if (isCancel(continuePrompt) || !continuePrompt) {
          console.log(chalk.yellow("\n👋 Great! Check your new application.\n"));
          break;
        }
      } else {
        throw new Error("Generation returned no result");
      }
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));

      const retry = await confirm({
        message: chalk.cyan("Would you like to try again?"),
        initialValue: true,
      });

      if (isCancel(retry) || !retry) {
        break;
      }
    }
  }
}

export async function startAgentChat(conversationId = null) {
  try {
    intro(
      boxen(
        chalk.bold.magenta("🤖 Byte AI - Agent Mode\n\n") +
        chalk.gray("Autonomous Application Generator"),
        {
          padding: 1,
          borderStyle: "double",
          borderColor: "magenta",
        }
      )
    );

    const { token } = await getUserFromToken();

    const shouldContinue = await confirm({
      message: chalk.yellow("⚠️  The agent will create files and folders in the current directory. Continue?"),
      initialValue: true,
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode cancelled"));
      process.exit(0);
    }

    const conversation = await initConversation(token, conversationId);
    await agentLoop(token, conversation);

    outro(chalk.green.bold("\n✨ Thanks for using Agent Mode!"));
  } catch (error) {
    const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.log(errorBox);
    process.exit(1);
  }
}