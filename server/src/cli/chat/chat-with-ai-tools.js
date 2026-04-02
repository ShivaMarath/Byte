import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, multiselect } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../services/chat.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { 
  availableTools, 
  getEnabledTools, 
  enableTools, 
  getEnabledToolNames,
  resetTools 
} from "../../config/tool.config.js";

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  })
);

const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  
  if (!token?.access_token) {
    throw new Error("Not authenticated. Please run 'orbit login' first.");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found. Please login again.");
  }

  spinner.success(`Welcome back, ${user.name}!`);
  return user;
}


async function selectTools() {
  const toolOptions = availableTools.map(tool => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));

  const selectedTools = await multiselect({
    message: chalk.cyan("Select tools to enable (Space to select, Enter to confirm):"),
    options: toolOptions,
    required: false,
  });

  if (isCancel(selectedTools)) {
    cancel(chalk.yellow("Tool selection cancelled"));
    process.exit(0);
  }

  // Enable selected tools
  enableTools(selectedTools);

  if (selectedTools.length === 0) {
    console.log(chalk.yellow("\n⚠️  No tools selected. AI will work without tools.\n"));
  } else {
    const toolsBox = boxen(
      chalk.green(`✅ Enabled tools:\n${selectedTools.map(id => {
        const tool = availableTools.find(t => t.id === id);
        return `  • ${tool.name}`;
      }).join('\n')}`),
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🛠️  Active Tools",
        titleAlignment: "center",
      }
    );
    console.log(toolsBox);
  }

  return selectedTools.length > 0;
}

async function initConversation(userId, conversationId = null, mode = "tool") {
  const spinner = yoctoSpinner({ text: "Loading conversation..." }).start();
  
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );
  
  spinner.success("Conversation loaded");
  
  // Get enabled tool names for display
  const enabledToolNames = getEnabledToolNames();
  const toolsDisplay = enabledToolNames.length > 0 
    ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
    : `\n${chalk.gray("No tools enabled")}`;
  
  // Display conversation info in a box
  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Tool Calling Session",
      titleAlignment: "center",
    }
  );
  
  console.log(conversationInfo);
  
  // Display existing messages if any
  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("📜 Previous messages:\n"));
    displayMessages(conversation.messages);
  }
  
  return conversation;
}
