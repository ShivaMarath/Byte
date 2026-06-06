import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, intro, outro } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { getStoredToken } from "../commands/auth/login.js";

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

async function initConversation(token, conversationId = null, mode = "chat") {
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

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Chat Session",
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
    } else {
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
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
      body: JSON.stringify({ message })
    });

    if (!res.ok) throw new Error("Failed to get AI response");
    if (!res.body) throw new Error("ReadableStream not yet supported in this fetch implementation");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      
      // Filter out metadata chunk
      if (chunk.includes("\n\n___METADATA___\n")) {
         const parts = chunk.split("\n\n___METADATA___\n");
         fullResponse += parts[0];
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
  const helpBox = boxen(
    `${chalk.gray("• Type your message and press Enter")}\n${chalk.gray("• Markdown formatting is supported in responses")}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray("• Press Ctrl+C to quit anytime")}`,
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

    await getAIResponse(token, conversation.id, userInput);
  }
}

export async function startChat(mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("Byte AI Chat"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const { token } = await getUserFromToken();
    const conversation = await initConversation(token, conversationId, mode);
    await chatLoop(token, conversation);

    outro(chalk.green("✨ Thanks for chatting!"));
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