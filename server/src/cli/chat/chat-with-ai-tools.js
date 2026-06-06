import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, multiselect } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { getStoredToken } from "../commands/auth/login.js";

// Tool config locally just to know the names/ids so the user can select them
const availableTools = [
  {
    id: 'google_search',
    name: 'Google Search',
    description: 'Access the latest information using Google search. Useful for current events, news, and real-time information.',
  },
  {
    id: 'code_execution',
    name: 'Code Execution',
    description: 'Generate and execute Python code to perform calculations, solve problems, or provide accurate information.',
  },
  {
    id: 'url_context',
    name: 'URL Context',
    description: 'Provide specific URLs that you want the model to analyze directly from the prompt. Supports up to 20 URLs per request.',
  },
];

let enabledToolIds = [];
function getEnabledToolNames() {
  return availableTools.filter(t => enabledToolIds.includes(t.id)).map(t => t.name);
}

const API_BASE = process.env.BYTE_API_URL ?? "https://byte-7lsq.onrender.com";

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

  enabledToolIds = selectedTools;

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

async function initConversation(token, conversationId = null, mode = "tool") {
  const spinner = yoctoSpinner({ text: "Loading conversation..." }).start();

  const res = await fetch(`${API_BASE}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ mode, conversationId })
  });

  if (!res.ok) {
    spinner.error("Failed to load conversation");
    throw new Error("Failed to load conversation");
  }

  const conversation = await res.json();
  spinner.success("Conversation loaded");

  const enabledToolNames = getEnabledToolNames();
  const toolsDisplay = enabledToolNames.length > 0
    ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
    : `\n${chalk.gray("No tools enabled")}`;

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

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("📜 Previous messages:\n"));
    displayMessages(conversation.messages);
  }

  return conversation;
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else if (msg.role === "assistant") {
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant (with tools)",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function getAIResponse(token, conversationId, message) {
  const spinner = yoctoSpinner({
    text: "AI is thinking...",
    color: "cyan",
  }).start();

  let fullResponse = "";
  let isFirstChunk = true;

  try {
    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message, toolsEnabled: enabledToolIds })
    });

    if (!res.ok) throw new Error("Failed to get AI response");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    let meta = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      
      if (chunk.includes("\n\n___METADATA___\n")) {
         const parts = chunk.split("\n\n___METADATA___\n");
         fullResponse += parts[0];
         if (parts[1]) {
           meta = JSON.parse(parts[1]);
         }
         break;
      }
      
      if (isFirstChunk) {
        spinner.stop();
        console.log("\n");
        console.log(chalk.green.bold("🤖 Assistant:"));
        console.log(chalk.gray("─".repeat(60)));
        isFirstChunk = false;
      }
      fullResponse += chunk;
      process.stdout.write(chunk);
    }

    if (meta && meta.toolCalls && meta.toolCalls.length > 0) {
      console.log("\n");
      const toolCallBox = boxen(
        meta.toolCalls.map(tc =>
          `${chalk.cyan("🔧 Tool:")} ${tc.toolName}\n${chalk.gray("Args:")} ${JSON.stringify(tc.args, null, 2)}`
        ).join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
          title: "🛠️  Tool Calls",
        }
      );
      console.log(toolCallBox);
    }

    if (meta && meta.toolResults && meta.toolResults.length > 0) {
      const toolResultBox = boxen(
        meta.toolResults.map(tr =>
          `${chalk.green("✅ Tool:")} ${tr.toolName}\n${chalk.gray("Result:")} ${JSON.stringify(tr.result, null, 2).slice(0, 200)}...`
        ).join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
          title: "📊 Tool Results",
        }
      );
      console.log(toolResultBox);
    }

    console.log("\n");
    console.log(chalk.gray("─".repeat(60)));
    console.log("\n");

    return fullResponse;
  } catch (error) {
    spinner.error("Failed to get AI response");
    throw error;
  }
}

async function chatLoop(token, conversation) {
  const enabledToolNames = getEnabledToolNames();
  const helpBox = boxen(
    `${chalk.gray("• Type your message and press Enter")}\n${chalk.gray("• AI has access to:")} ${enabledToolNames.length > 0 ? enabledToolNames.join(", ") : "No tools"}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray("• Press Ctrl+C to quit anytime")}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("💬 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 You",
      titleAlignment: "left",
    });
    console.log(userBox);

    await getAIResponse(token, conversation.id, userInput);
  }
}

export async function startToolChat(conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("🛠️  Byte AI - Tool Calling Mode"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const { token } = await getUserFromToken();
    await selectTools();
    const conversation = await initConversation(token, conversationId, "tool");
    await chatLoop(token, conversation);

    enabledToolIds = [];
    outro(chalk.green("✨ Thanks for using tools!"));
  } catch (error) {
    const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.log(errorBox);
    enabledToolIds = [];
    process.exit(1);
  }
}